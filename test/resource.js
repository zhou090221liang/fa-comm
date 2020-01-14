const fac = require('../index');
const setting = require('./setting');
fac.service.resource({
    mysql: setting.mysql
});