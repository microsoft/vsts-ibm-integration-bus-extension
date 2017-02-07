/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
'use strict';

import fs = require('fs');
import path = require('path');
import tl = require('vsts-task-lib/task');

import { ToolRunner, IExecResult } from 'vsts-task-lib/toolrunner';

function isValidFilePath(filePath: string): boolean {
    try {
        return fs.statSync(filePath).isFile();
    } catch (error) {
        return false;
    }
}

// Attempts to find a single file to use by the task.
// If a glob pattern is provided, only a single file is allowed.
function findFile(filePath: string): string {
    let paths: string[] = tl.glob(filePath);
    if (!paths || paths.length === 0) {
        throw new Error(tl.loc('NoFilesFound', filePath));
    }
    if (paths.length > 1) {
        throw new Error(tl.loc('MultipleFilesFound', filePath));
    }
    return paths[0];
}

function addConnectionSpec(tr: ToolRunner): void {

    // Get IntegrationNode spec variables
    let connType: string = tl.getInput('connType', true);
    if (connType === 'file') {
        let brokerConfigFile: string = findFile(tl.getInput('configFile', true));
        tr.arg(['-n', brokerConfigFile]);

    } else if (connType === 'address') {
        let integrationNodeName: string = tl.getInput('integrationNodeName', true);
        let ipAddress: string = tl.getInput('ipAddress', true);
        let port: string = tl.getInput('port', false);
        let queueManager: string = tl.getInput('queueManager', false);

        let username: string = tl.getInput('username', false);
        let password: string = tl.getInput('password', false);

        setupIntegrationNodeSpec(tr, integrationNodeName, ipAddress, port, queueManager, username, password);

    } else if (connType === 'serviceEndpoint') {
        let serverEndpoint: string = tl.getInput('iibEndpoint', true);
        let ipAddress: string = tl.getEndpointDataParameter(serverEndpoint, 'ipAddress', false);
        let integrationNodeName: string = tl.getEndpointDataParameter(serverEndpoint, 'integrationNode', false);

        let username: string = tl.getEndpointAuthorizationParameter(serverEndpoint, 'username', true);
        let password: string = tl.getEndpointAuthorizationParameter(serverEndpoint, 'password', true);

        let port: string = tl.getEndpointDataParameter(serverEndpoint, 'port', true);
        let queueManager: string = tl.getEndpointDataParameter(serverEndpoint, 'queueManager', true);

        setupIntegrationNodeSpec(tr, integrationNodeName, ipAddress, port, queueManager, username, password);
    }

    // Get Integration Server name
    let integrationServer: string = tl.getInput('integrationServerName', true);
    tr.arg(['-e', integrationServer]);
}

function setupIntegrationNodeSpec(tr: ToolRunner, integrationNodeName: string, ipAddress: string, port: string,
                                  queueManager: string, username: string, password: string): void {

    tr.arg(integrationNodeName);

    let credspec;
    if (username) {
        credspec = encodeURIComponent(username);
        if (password) {
            credspec = `${credspec}:${encodeURIComponent(password)}`;
        }
    }

    if (credspec) {
        ipAddress = `tcp://${credspec}@${ipAddress}`;
        tl.debug(`Connecting to ${ipAddress}`);
    }

    tr.arg(['-i', ipAddress]);
    if (port) {
        tr.arg(['-p', port]);
    }

    if (queueManager) {
        tr.arg(['-q', queueManager]);
    }
}

function checkExecutionGroup(): boolean {
    let mqsilist: ToolRunner = tl.tool(tl.which('mqsilist', true));
    addConnectionSpec(mqsilist);
    let result: IExecResult = mqsilist.execSync();
    if (result.code === 0) {
        return true;
    } else {
        if (result.stdout && result.stdout.indexOf('BIP1038') > -1) {
            // BIP1038 = Execution Group does not exist
            return false;
        }
    }

    // If we failed for whatever reason other than Execution Group doesn't exists, throw the error
    throw new Error(result.stdout);
}

async function createExecutionGroup() {
    let mqsicreateexecutiongroup = tl.tool(tl.which('mqsicreateexecutiongroup', true));
    addConnectionSpec(mqsicreateexecutiongroup);
    await mqsicreateexecutiongroup.exec();
}

async function run() {
    try {
        tl.setResourcePath(path.join(__dirname, 'task.json'));

        let barPath: string = tl.getInput('barPath', true);
        let completeDeployment: boolean = tl.getBoolInput('completeDeployment', false);
        let timeoutSecs: string = tl.getInput('timeoutSecs', false);
        let options: string = tl.getInput('options', false);
        let restartIntegrationServer: boolean = tl.getBoolInput('restartIntegrationServer', false);

        // Ensure there's exactly one bar 
        let barFile = findFile(barPath);
        if (!isValidFilePath(barFile)) {
            throw new Error(tl.loc('InvalidFile'));
        }

        // Check for existance of Execution Group (Integration Server in v10)
        tl.debug('Checking for executing group...');

        let executionGroupExists: boolean = checkExecutionGroup();
        if (!executionGroupExists) {
            await createExecutionGroup();
        }

        // Deploy the BAR file
        let mqsideploy: ToolRunner = tl.tool(tl.which('mqsideploy', true));
        addConnectionSpec(mqsideploy);

        mqsideploy.arg(['-a', barFile]);
        if (completeDeployment) {
            mqsideploy.arg('-m');
        }

        if (timeoutSecs) {
            mqsideploy.arg(['-w', timeoutSecs]);
        }

        if (options) {
            mqsideploy.line(options);
        }

        await mqsideploy.exec();

        // https://www.ibm.com/support/knowledgecenter/en/SSMKHH_10.0.0/com.ibm.etools.mft.doc/an03994_.htm
        if (restartIntegrationServer) {
            // Stop Integration Server
            let mqsistopmsgflow: ToolRunner = tl.tool(tl.which('mqsistopmsgflow', true));
            addConnectionSpec(mqsistopmsgflow);
            await mqsistopmsgflow.exec();

            // Start Integration Server
            let mqsistartmsgflow: ToolRunner = tl.tool(tl.which('mqsistartmsgflow', true));
            addConnectionSpec(mqsistartmsgflow);
            await mqsistartmsgflow.exec();
        }

        tl.setResult(tl.TaskResult.Succeeded, tl.loc('SuccessfullyPublished', barPath));

    } catch (err) {
        tl.setResult(tl.TaskResult.Failed, err);
    }
}

run();
