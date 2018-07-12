## FreeSWITCH (FusionPBX) integration script with AmoCRM
This script is designed to integrate IP PBX FreeSWITCH (FusionPBX) with the popular CRM system AmoCRM. The script works through the Asterisk widget on the AmoCRM side. Integration allows:

Preliminary informing the manager about who is calling him (the client's card appears on the computer screen immediately after the call, even before the employee picked up the phone)

Dialing a number directly from the CRM system (if you click on the desired number in the CRM, the system will automatically call this contact)

Listening to calls directly from the CRM system


### Installation

```shell
npm install 
```

### Usage

All the connection settings to the database and FreeSWITCH are made in config.js :

```javascript

config.recordPathLink = 'https://you-ip-address-or-domain/archive/';
config.recordPath = '/var/www/fusionpbx/rec/archive/';

config.esl.ip = '127.0.0.1';
config.esl.port = 8021;
config.esl.password = 'ClueCon';

config.amocrm.username = 'adminfs';
config.amocrm.secret = '17W9QJ2Hqmt';

config.fs.domain = 'you-ip-address-or-domain';
config.fs.gateway = 'fs-outbound-gateway';

config.pg.user = 'fs';
config.pg.host = 'localhost';
config.pg.database = 'fusionpbx'
config.pg.password = 'admin123033';
config.pg.port = 5432;
```

An extended configuration instruction can be found at the [freeswitch-amocrm](https://voipnotes.ru/integratsiya-freeswitch-amocrm/).
