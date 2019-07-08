"use strict";
const logger = require('./logger');
const appConfig = require('./config');
const express = require("express");
const app = express();
const server = app.listen(3000);
const url = require('url');
const esl = require('modesl');
const moment = require('moment');
const {
	Client
} = require('pg');

let fromDate = {};

const client = new Client({
	user: appConfig.pg.user,
	host: appConfig.pg.host,
	database: appConfig.pg.database,
	password: appConfig.pg.password,
	port: appConfig.pg.port,
})
client.connect();

let conn = null,
	reconnectTimeout = null,
	waitTime = 1000;

function fsConnect() {
	conn = new esl.Connection(appConfig.esl.ip, appConfig.esl.port, appConfig.esl.password);
	conn.on('error', (err) => {
		logger.debug('Unable to connect to FreeSWITCH');
		setTimeout(fsConnect, waitTime);
	});
	conn.on("esl::end", (event) => {
		logger.debug('Connection to FreeSWITCH aborted');
	});

}
fsConnect();

app.get("/amocrm.js", (req, res) => {
	let queryData = url.parse(req.url, true).query;
	if (queryData._login == appConfig.amocrm.username && queryData._secret == appConfig.amocrm.secret) {
		switch (queryData._action) {
			case 'call':
				fsCall(queryData.to, queryData.from, (data) => {
					let callOriginate = {
						"status": "ok",
						"data": data
					};
					return res.send("initCall(" + JSON.stringify(callOriginate) + ");");
				});
				break;
			case 'cdr':
				var calldate = [queryData.date_from, queryData.date_to];
				getTimestamp(calldate, (data) => {
					let sendCDR = {
						"status": "ok",
						"data": data
					};
					return res.send(sendCDR);
				});
				break;
			case 'status':
				getStatus(queryData._action, (data) => {
					let sendStatus = {
						"status": "ok",
						"action": queryData._action,
						"data": data
					};
					return res.send("asterisk_cb(" + JSON.stringify(sendStatus) + ");");
				});
				break;
		}

	} else if (queryData.GETFILE) {
		getRecording(queryData.GETFILE, (recordingDate, recordingName) => {
			let day = recordingDate.getDate();
			let month = moment(recordingDate).format('MMM');
			let year = recordingDate.getFullYear();
			let recordUrl = appConfig.recordPathLink + year + '/' + month + '/' + day + '/';
			res.redirect(301, recordUrl + recordingName);
		})
	} else {
		logger.debug('Incorrect password or request');
		return res.status(404).send('Incorrect password or request');
	}


});

function getRecording(recording, callback) {
	client.query(`select start_stamp,record_name FROM xml_cdr_uuid WHERE uuid = '${recording}'`, (err, result) => {
		if (err) {
			logger.debug('getRecording function request failed: ', err)
		};
		if (result.rowCount !== 0) {
			callback(result.rows[0].start_stamp, result.rows[0].record_name);
		} else {
			logger.debug('The request failed: ', result)
		}
	});

}

function fsCall(toNumber, fromExten, callback) {
	conn.bgapi('create_uuid', (result) => {
		let uuid = result.getBody();
		let now = new Date();
		let day = now.getDate();
		let month = moment(now).format('MMM');
		let year = now.getFullYear();
		let recordDir = appConfig.recordPath + year + '/' + month + '/' + day + '/';
		conn.bgapi(`originate {origination_caller_id_number=${toNumber},origination_uuid=${uuid},execute_on_answer='record_session::${recordDir}${uuid}.wav'}user/${fromExten}@${appConfig.fs.domain} &bridge(sofia/gateway/${appConfig.fs.gateway}/${toNumber})`, (result) => {
			//logger.debug('fsCall function request failed: ', err)
			callback('Orinate Call from ' + fromExten + ' to number ' + toNumber);
		});
	});
}

function getCDR(fromDate, callback) {
	client.query(`select  to_char(((start_stamp) - interval '3 hour'), 'YYYY-MM-DD HH24:MI:SS') as  calldate, caller_id_number as src, destination_number as dst, billsec,xml_cdr_uuid as uniqueid, record_name as recordingfile, json-> 'variables' ->> 'endpoint_disposition' as endpoint from v_xml_cdr WHERE leg like 'a' and billsec>=10 and start_stamp > '${fromDate[0]}' AND start_stamp < '${fromDate[1]}'`, (err, result) => {
		if (err) {
			logger.debug('getCDR function request failed: ', err);
		};
		fromDate = {};
		callback(result.rows);

	});
}

function getStatus(data, callback) {
	conn.api('show channels as json', (result) => {
		let data = JSON.parse(result.getBody());
		if (data.hasOwnProperty('rows') && data.rows[1] !== undefined && data.rows[1].callstate == 'RINGING') {
			if (data.rows[1].callstate == 'RINGING') {
				data.rows[1].callstate = 'Ringing';
				let fsEvent = [{
					"event": "Status",
					"privilege": "Call",
					"channel": data.rows[1].name,
					"channelstate": "5",
					"channelstatedesc": data.rows[1].callstate,
					"calleridnum": data.rows[1].callee_num,
					"calleridname": data.rows[1].callee_name,
					"connectedlinenum": data.rows[1].initial_cid_num.slice(1),
					"connectedlinename": data.rows[1].initial_cid_name,
					"accountcode": "",
					"context": data.rows[1].context,
					"exten": data.rows[1].callee_num,
					"priority": "1",
					"uniqueid": "from-internal", //data.rows[1].uuid,
					"type": "SIP",
					"dnid": "",
					"effectiveconnectedlinenum": data.rows[1].initial_cid_num,
					"effectiveconnectedlinename": data.rows[1].initial_cid_name,
					"timetohangup": "0",
					"bridgeid": "",
					"linkedid": data.rows[1].call_uuid,
					"application": data.rows[1].application,
					"data": "",
					"nativeformats": data.rows[0].write_codec,
					"readformat": data.rows[0].write_codec,
					"readtrans": "",
					"writeformat": data.rows[0].write_codec,
					"writetrans": "",
					"callgroup": "0",
					"pickupgroup": "0",
					"seconds": "4"

				}];
				callback(fsEvent);
			} else {
				let fsEvent = [];
				callback(fsEvent);
			}

		} else {
			let fsEvent = [];
			callback(fsEvent);
		}
	});
}

function getTimestamp(calldate, callback) {
	for (let i = 0; i < calldate.length; i++) {
		fromDate[i] = moment.unix(calldate[i]).format('YYYY-MM-DD H:mm');
	}
	getCDR(fromDate, callback);
}
