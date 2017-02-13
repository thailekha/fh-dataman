import BatchStream from './BatchStream';
import InsertMixin from './InsertMixin';

class InsertStream extends InsertMixin(BatchStream) {}

export { InsertStream };
