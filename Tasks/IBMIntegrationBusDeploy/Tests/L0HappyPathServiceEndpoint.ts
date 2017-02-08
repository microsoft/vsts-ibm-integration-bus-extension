 /*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import tmrm = require('vsts-task-lib/mock-run');
import path = require('path');
import fs = require('fs');
import ma = require('vsts-task-lib/mock-answer');

let taskPath = path.join(__dirname, '..', 'iib-deploy.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

process.env['ENDPOINT_DATA_mock_endpoint_INTEGRATIONNODE'] = 'myNode';
process.env['ENDPOINT_DATA_mock_endpoint_IPADDRESS'] = 'test.com';
process.env['ENDPOINT_DATA_mock_endpoint_PORT'] = '1234';
process.env['ENDPOINT_AUTH_PARAMETER_mock_endpoint_USERNAME'] = 'user';
process.env['ENDPOINT_AUTH_PARAMETER_mock_endpoint_PASSWORD'] = 'pass';

tmr.setInput('barPath', '**/*.bar');
tmr.setInput('completeDeployment', 'true');
tmr.setInput('options', '-v tracefile');
tmr.setInput('restartIntegrationServer', 'false');
tmr.setInput('integrationServerName', 'myServer');
tmr.setInput('iibEndpoint', 'mock_endpoint');
tmr.setInput('connType', 'serviceEndpoint');

let myAnswers: ma.TaskLibAnswers = <ma.TaskLibAnswers> {
    'glob': {
        '**/*.bar': ['/my/brokerarchive.bar'],
        '/my/config.broker': ['/my/config.broker']
    },
    'which': {
        'mqsicreateexecutiongroup': 'mqsicreateexecutiongroup',
        'mqsilist': 'mqsilist',
        'mqsideploy': 'mqsideploy',
        'mqsistopmsgflow': 'mqsistopmsgflow',
        'mqsistartmsgflow': 'mqsistartmsgflow'
    },
    'checkPath': {
        'mqsicreateexecutiongroup': true,
        'mqsilist': true,
        'mqsideploy': true,
        'mqsistopmsgflow': true,
        'mqsistartmsgflow': true
    },
    'exec': {
        'mqsilist myNode -i tcp://user:pass@test.com -p 1234 -e myServer': {
            'code': 2,
            'stdout': 'blahblahblah BIP1038S: blahblahblah',
            'stderr': undefined
        },
        'mqsicreateexecutiongroup myNode -i tcp://user:pass@test.com -p 1234 -e myServer': {
            'code': 0,
            'stdout': 'successfully created',
            'stderr': undefined
        },
        'mqsideploy myNode -i tcp://user:pass@test.com -p 1234 -e myServer -a /my/brokerarchive.bar -m -v tracefile' : {
            'code': 0,
            'stdout': 'deployed',
            'stderr': undefined
        }
    }
 };

tmr.setAnswers(myAnswers);

// This is how you can mock NPM packages...
fs.statSync = (s) => {
    let stats = require('fs').Stats;
    let stat = new stats();
    stat.isFile = () => {
        console.log(s);
        if (s === '/my/brokerarchive.bar') {
            return true;
        }
    };

    return stat;
};
tmr.registerMock('fs', fs);

tmr.run();
