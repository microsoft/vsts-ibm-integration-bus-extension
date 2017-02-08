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

tmr.setInput('cmd', 'command');
tmr.setInput('args', 'my other args');
tmr.setInput('connType', 'address');
tmr.setInput('integrationNodeName', 'myNode');
tmr.setInput('ipAddress', 'test.com');
tmr.setInput('username', 'user');
tmr.setInput('password', '@#$%^');
tmr.setInput('port', '1234');

let myAnswers: ma.TaskLibAnswers = <ma.TaskLibAnswers> {
    'which': {
        'command': 'command'
    },
    'checkPath': {
        'command': true
    },
    'exec': {
        'command myNode -i tcp://user:%40%23%24%25%5Es@test.com -p 1234 my other args': {
            'code': 1,
            'stdout': 'Command Failed',
            'stderr': undefined
        }
    }
 };

tmr.setAnswers(myAnswers);

tmr.run();
