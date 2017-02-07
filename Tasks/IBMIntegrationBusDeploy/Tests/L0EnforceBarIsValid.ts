 /*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import tmrm = require('vsts-task-lib/mock-run');
import path = require('path');
import fs = require('fs');

let taskPath = path.join(__dirname, '..', 'iib-deploy.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tmr.setInput('barPath', '**/*.bar');

let myAnswers = {
    'glob': {
        '**/*.bar': ['/my/brokerarchive.bar']
    }
 };

tmr.setAnswers(myAnswers);

// This is how you can mock NPM packages...
fs.statSync = (s) => {
    let stats = require('fs').Stats;
    let stat = new stats();
    stat.isFile = () => {
        if (s === '/my/brokerarchive.bar') {
            return false;
        }

        return true;
    };

    return stat;
};
tmr.registerMock('fs', fs);

tmr.run();
