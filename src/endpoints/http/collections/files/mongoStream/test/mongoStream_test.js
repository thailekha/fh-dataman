import assert from 'assert';
import sinon from 'sinon';
import sinonStubPromise from 'sinon-stub-promise';
import EventEmitter from 'events';
import proxyquire from 'proxyquire';
import fs from 'fs';

import { InsertStream } from  '../index';

export function fooTest(done) {
	const underTest = new InsertStream();

	
}