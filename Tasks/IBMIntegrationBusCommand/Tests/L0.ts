/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
'use strict';

import * as path from 'path';
import * as assert from 'assert';
import * as ttm from 'vsts-task-lib/mock-test';

// npm install mocha --save-dev
// typings install dt~mocha --save --global

describe('IBM Integration Bus L0 Suite', function () {
    /* tslint:disable:no-empty */
    before(() => {
        //process.env['TASK_TEST_TRACE'] = 1;
    });

    after(() => {
    });
    /* tslint:enable:no-empty */

    it('happy path with .broker file - command succeeded', (done: MochaDone) => {
        this.timeout(1000);

        let tp = path.join(__dirname, 'L0HappyPathBrokerFile.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();

        assert(tr.ran('command -n /my/config.broker args1 args2'), 'it should have run command');
        assert(tr.invokedToolCount === 1, 'should have run command');
        assert(tr.succeeded, 'task should have succeeded');

        done();
    });

    it('negative path with service endpoint - command failed', (done: MochaDone) => {
        this.timeout(1000);

        let tp = path.join(__dirname, 'L0ServiceEndpoint.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();
        assert(tr.ran('command myNode -i tcp://user:pass@test.com -p 1234 my other args'), 'it should have run command');
        assert(tr.invokedToolCount === 1, 'should have run command');
        assert(tr.failed, 'task should have failed');

        done();
    });

    it('positive path with manually entering credentials.', (done: MochaDone) => {
        this.timeout(1000);

        let tp = path.join(__dirname, 'L0HappyPathEnterCredentials.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();
        assert(tr.ran('command myNode -i tcp://user:%40%23%24%25%5E@test.com -p 1234 my other args'), 'it should have run command');
        assert(tr.invokedToolCount === 1, 'should have run command');
        assert(tr.failed, 'task should have failed');

        done();
    });
});
