 /*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

// npm install mocha --save-dev
// typings install dt~mocha --save --global

import * as path from 'path';
import * as assert from 'assert';
import * as ttm from 'vsts-task-lib/mock-test';

describe('IBM Integration Bus L0 Suite', function () {
    /* tslint:disable:no-empty */
    before(() => {
        //process.env['TASK_TEST_TRACE'] = 1;
    });

    after(() => {
    });
    /* tslint:enable:no-empty */

    it('happy path with .broker file', (done: MochaDone) => {
        this.timeout(1000);

        let tp = path.join(__dirname, 'L0HappyPathBrokerFile.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();

        assert(tr.ran('mqsilist -n /my/config.broker -e myServer'), 'it should have run mqsilist');
        assert(tr.ran('mqsicreateexecutiongroup -n /my/config.broker -e myServer'), 'it should have run mqsicreateexecutiongroup');
        assert(tr.ran('mqsideploy -n /my/config.broker -e myServer -a /my/brokerarchive.bar -m -v tracefile'), 'it should have run mqsideploy');
        assert(tr.ran('mqsistopmsgflow -n /my/config.broker -e myServer'), 'it should have run mqsistopmsgflow');
        assert(tr.ran('mqsistartmsgflow -n /my/config.broker -e myServer'), 'it should have run mqsistartmsgflow');
        assert(tr.invokedToolCount === 5, 'should have run mqsi command five times');
        assert(tr.succeeded, 'task should have succeeded');

        done();
    });

    it('happy path with service endpoint', (done: MochaDone) => {
        this.timeout(1000);

        let tp = path.join(__dirname, 'L0HappyPathServiceEndpoint.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();
        assert(tr.ran('mqsilist myNode -i tcp://user:pass@test.com -p 1234 -e myServer'), 'it should have run mqsilist');
        assert(tr.ran('mqsicreateexecutiongroup myNode -i tcp://user:pass@test.com -p 1234 -e myServer'), 'it should have run mqsicreateexecutiongroup');
        assert(tr.ran('mqsideploy myNode -i tcp://user:pass@test.com -p 1234 -e myServer -a /my/brokerarchive.bar -m -v tracefile'), 'it should have run mqsideploy');
        assert(tr.invokedToolCount === 3, 'should have run mqsi command three times (no restart).');
        assert(tr.succeeded, 'task should have succeeded');

        done();
    });

    it('happy path with entering credential', (done: MochaDone) => {
        this.timeout(1000);

        let tp = path.join(__dirname, 'L0HappyPathEnterCredentials.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();
        assert(tr.ran('mqsilist myNode -i tcp://user:pass@test.com -p 1234 -q qm -e myServer'), 'it should have run mqsilist');
        assert(tr.ran('mqsicreateexecutiongroup myNode -i tcp://user:pass@test.com -p 1234 -q qm -e myServer'), 'it should have run mqsicreateexecutiongroup');
        assert(tr.ran('mqsideploy myNode -i tcp://user:pass@test.com -p 1234 -q qm -e myServer -a /my/brokerarchive.bar -m -v tracefile'), 'it should have run mqsideploy');
        assert(tr.invokedToolCount === 3, 'should have run mqsi command three times (no restart).');
        assert(tr.succeeded, 'task should have succeeded');

        done();
    });

    it('password needs to be url encoded', (done: MochaDone) => {
        this.timeout(1000);

        let tp = path.join(__dirname, 'L0EncodePassword.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();
        assert(tr.ran('mqsilist myNode -i tcp://user:%40%23%24%25%5E@test.com -p 1234 -e myServer'), 'it should have run mqsilist');
        assert(tr.invokedToolCount === 1, 'should have run mqsilist');
        assert(tr.failed, 'task should have failed if mqsilist failed other than execution group does not exist');

        done();
    });

    it('enforce barfile is valid', (done:MochaDone) => {
        this.timeout(1000);

        let tp = path.join(__dirname, 'L0EnforceBarIsValid.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();
        assert.equal(true, tr.createdErrorIssue('Error: loc_mock_InvalidFile'));
        assert(tr.failed, 'task should have failed');

        done();
    });

    it('enforce only resolve to one barfile', (done:MochaDone) => {
        this.timeout(1000);

        let tp = path.join(__dirname, 'L0EnforceOneBarFile.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();
        assert.equal(true, tr.createdErrorIssue('Error: loc_mock_MultipleFilesFound'));
        assert(tr.failed, 'task should have failed');

        done();
    });

});
