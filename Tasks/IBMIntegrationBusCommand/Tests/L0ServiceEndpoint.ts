 /*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import tmrm = require('vsts-task-lib/mock-run');
import path = require('path');
import ma = require('vsts-task-lib/mock-answer');

let taskPath = path.join(__dirname, '..', 'iib-command.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

process.env['ENDPOINT_DATA_mock_endpoint_INTEGRATIONNODE'] = 'myNode';
process.env['ENDPOINT_DATA_mock_endpoint_IPADDRESS'] = 'test.com';
process.env['ENDPOINT_DATA_mock_endpoint_PORT'] = '1234';
process.env['ENDPOINT_AUTH_PARAMETER_mock_endpoint_USERNAME'] = 'user';
process.env['ENDPOINT_AUTH_PARAMETER_mock_endpoint_PASSWORD'] = 'pass';

tmr.setInput('cmd', 'command');
tmr.setInput('args', 'my other args');
tmr.setInput('iibEndpoint', 'mock_endpoint');
tmr.setInput('connType', 'serviceEndpoint');

let myAnswers: ma.TaskLibAnswers = <ma.TaskLibAnswers> {
    'which': {
        'command': 'command'
    },
    'checkPath': {
        'command': true
    },
    'exec': {
        'command myNode -i tcp://user:pass@test.com -p 1234 my other args': {
            'code': 1,
            'stdout': 'Command Failed',
            'stderr': undefined
        }
    }
 };

tmr.setAnswers(myAnswers);

tmr.run();
