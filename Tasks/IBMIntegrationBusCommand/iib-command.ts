/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
'use strict';

import path = require('path');
import tl = require('vsts-task-lib/task');

import { ToolRunner } from 'vsts-task-lib/toolrunner';

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

async function run() {
    try {
        tl.setResourcePath(path.join(__dirname, 'task.json'));

        let command: string = tl.getInput('cmd', true);
        let args: string = tl.getInput('args', true);

        let cmd: ToolRunner = tl.tool(tl.which(command, true));
        addConnectionSpec(cmd);

        cmd.line(args);

        await cmd.exec();

        tl.setResult(tl.TaskResult.Succeeded, tl.loc('CommandSuccessful'));
    } catch (err) {
        tl.setResult(tl.TaskResult.Failed, err);
    }
}

run();
