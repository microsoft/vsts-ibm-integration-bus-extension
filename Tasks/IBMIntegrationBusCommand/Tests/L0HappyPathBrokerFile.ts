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

tmr.setInput('configFile', '/my/config.broker');
tmr.setInput('connType', 'file');
tmr.setInput('cmd', 'command');
tmr.setInput('args', 'args1 args2');

let myAnswers: ma.TaskLibAnswers = <ma.TaskLibAnswers> {
    'glob': {
        '/my/config.broker': ['/my/config.broker']
    },
    'which': {
        'command': 'command'
    },
    'checkPath': {
        'command': true
    },
    'exec': {
        'command -n /my/config.broker args1 args2': {
            'code': 0,
            'stdout': 'command ran',
            'stderr': undefined
        }
    }
 };

tmr.setAnswers(myAnswers);

tmr.run();
