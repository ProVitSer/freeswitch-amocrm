const config = {}
config.esl = {};
config.amocrm = {};
config.pg = {};
config.fs = {};

//Path to call records. Symbolic link ln -s /var/lib/freeswitch/recordings/you-ip-address-or-domain/archive/ /var/www/fusionpbx/rec
config.recordPathLink = 'https://you-ip-address-or-domain/rec/archive/';
config.recordPath = '/var/www/fusionpbx/rec/archive/';

//Data for connection to FreeSWITCH
config.esl.ip = '127.0.0.1';
config.esl.port = 8021;
config.esl.password = 'ClueCon';

//Login and password specified in the integration widget settings in AmoCRM
config.amocrm.username = 'adminpami';
config.amocrm.secret = '17W9QJ2Hqmt';

//Domain in which there are internal subscribers, and Gateway through which outgoing calls will be made
config.fs.domain = 'you-ip-address-or-domain';
config.fs.gateway = '0fc05f4c-7011-42d6-927e-64bc90ecb455';

//Data for connection to PostgreSQL
config.pg.user = 'fs';
config.pg.host = 'localhost';
config.pg.database = 'fusionpbx'
config.pg.password = 'admin123033';
config.pg.port = 5432;

module.exports = config;
