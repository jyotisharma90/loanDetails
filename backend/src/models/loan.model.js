let express = require("express")
let router = express.Router()
let mysql = require("mysql")
let http = require('https');
const multer = require('multer')
var xlstojson = require("xls-to-json-lc");
var xlsxtojson = require("xlsx-to-json-lc");
var moment = require('moment')
var connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'Sree@1254.',
	database: 'loandata',
	multipleStatements: true
});
//Login
router.post('/login', function (request, response) {
	var username = request.body.username;
	var password = request.body.password;
	console.log(request.body)
	response.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
	//request.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
	if (username && password) {
		connection.query('SELECT * FROM userdetails WHERE username = ? AND password = ?', [username, password], function (error, results, fields) {
			if (results.length > 0) {
				//	request.session.loggedin = true;
				// request.session.username = username;
				let responseData = { "status": true, "code": 200, "userDetails": results }
				response.json(responseData)
			} else {
				let responseData = { "status": false, "code": 401, "message": "Incorrect Username and/or Password!" }
				response.json(responseData)
			}
			response.end();
		});
	} else {
		let responseData = { "status": false, "code": 401, "message": "Please enter Username and Password!" }
		response.json(responseData)
		response.end();
	}
});

//Register Employee
router.post('/registerEmployee', function (request, response) {
	console.log(request.body)
	var name = request.body.name;
	var username = request.body.username;
	var password = request.body.password;
	var email = request.body.email;
	var mobile = request.body.mobile;
	var bucket = request.body.assignedbucket;
	var language = request.body.language
	if (name && username && password && email && mobile ) {
		var data = {
			client_id:"1",
			name: name,
			username: username,
			email:email,
			password: password,
			mobile:mobile,
			bucket_id:bucket,
			usertype: '0',
			active:"1"
		}
		connection.query('INSERT INTO userdetails SET ?', data, function (error, results, fields) {
			console.log(JSON.stringify(error))
			if(error){
				let responseData = { "status": false, "code": 402, "message": JSON.stringify(error) }
				response.json(responseData)
				response.end();
			}else{
				var lastinserttedId = results.insertId;
				let inserData = '';
				let queryTest
				let startQuery = "INSERT INTO `user_known_languages` (`userId`,`languageId`) VALUES";
				// let duplicateColumn = "ON DUPLICATE KEY UPDATE `userId`=VALUES(`userId`),`languageId`=VALUES(`languageId`)"
				let responseData;
				//console.log(loanDetails)
				language.map(item => {
					currentRow = `('${lastinserttedId}','${item.id}'),`
					currentRow = currentRow.replace(/\n|\r/g, "");
					currentRow = currentRow.replace(/~+$/, '');
					inserData = inserData + currentRow
				});
				inserData = inserData.replace(/,\s*$/, "");
				queryTest = startQuery + inserData;
				console.log(queryTest)
				connection.query(queryTest, (err, results, fields) => {
				//	console.log(results)
					if (results) {
						//	request.session.loggedin = true;
						// request.session.username = username;
						let responseData = { "status": true, "code": 200, "message": "Employee register successfully" }
						response.json(responseData)
					} else {
						let responseData = { "status": false, "code": 401, "message": "Unable to register employee" }
						response.json(responseData)
					}
					response.end();
				});
			}
		});
	
	} else {
		let responseData = { "status": false, "code": 401, "message": "Please enter employee details" }
		response.json(responseData)
		response.end();
	}
});

router.post('/updateEmployee', function (request, response) {
	console.log(request.body)
	var id = request.body.id;
	var name = request.body.name;
	var username = request.body.username;
	var password = request.body.password;
	var email = request.body.email;
	var mobile = request.body.mobile;
	var bucket = request.body.assignedbucket;
	var language = request.body.language
	if (id) {
		connection.query(`update userdetails set name ='${name}',username ='${username}',email='${email}',mobile='${mobile}',bucket_id= '${bucket}' where id = '${id}'`, function (error, results, fields) {
			if (results) {
				//Deleting emp old languages
				connection.query(`DELETE FROM user_known_languages where userId = '${id}'`, function (error, results, fields) {
					if (results) {
						let inserData = '';
						let queryTest
						let startQuery = "INSERT INTO `user_known_languages` (`userId`,`languageId`) VALUES";
						// let duplicateColumn = "ON DUPLICATE KEY UPDATE `userId`=VALUES(`userId`),`languageId`=VALUES(`languageId`)"
						let responseData;
						//console.log(loanDetails)
						language.map(item => {
							currentRow = `('${id}','${item.id}'),`
							currentRow = currentRow.replace(/\n|\r/g, "");
							currentRow = currentRow.replace(/~+$/, '');
							inserData = inserData + currentRow
						});
						inserData = inserData.replace(/,\s*$/, "");
						queryTest = startQuery + inserData;
						console.log(queryTest)
						connection.query(queryTest, (err, results, fields) => {
							if (results) {
								let responseData = { "status": true, "code": 200, "message": "Employee Details updated successfully" }
								response.json(responseData)
							} else {
								let responseData = { "status": false, "code": 401, "message": "Failed to update Employee Details", "err" :  error}
								response.json(responseData)
							}
							response.end();
						});
					} else {
						let responseData = { "status": false, "code": 401, "message": "Failed to update Employee Details", "err" :  error}
						response.json(responseData)
					}
				});
			} else {
				let responseData = { "status": false, "code": 401, "message": "Failed to update Employee Details", "err" :  error}
				response.json(responseData)
			}
		});
	} else {
		let responseData = { "status": false, "code": 401, "message": "Please check details" }
		response.json(responseData)
		response.end();
	}
});

router.post('/deActivateEmployee', function (request, response) {
	var empid = request.body.empid;
	if(empid){
		connection.query(`update userdetails set active ='0' where id = '${empid}'`, function (error, results, fields) {
			if (results) {
				connection.query(`update loan_details set assigned_emp_id = NULL, is_assigned = 0 where assigned_emp_id = '${empid}'`, function (error, results, fields) {
					if (results) {
						let responseData = { "status": true, "code": 200, "message": "Employee Deactivate successfully" }
						response.json(responseData)
					} else {
						let responseData = { "status": false, "code": 401, "message": "Deactivated Employee Success. Failed to un assaign loans", "err" :  error}
						response.json(responseData)
					}
				});
			} else {
				let responseData = { "status": false, "code": 401, "message": "Failed to Deactivate Employee", "err" :  error}
				response.json(responseData)
			}
		});
	}else {
		let responseData = { "status": false, "code": 401, "message": "Please check details" }
		response.json(responseData)
		response.end();
	}
})
router.post('/activateEmployee', function (request, response) {
	var empid = request.body.empid;
	if(empid){
		connection.query(`update userdetails set active ='1' where id = '${empid}'`, function (error, results, fields) {
			if (results) {
				let responseData = { "status": true, "code": 200, "message": "Employee activate successfully" }
				response.json(responseData)
			} else {
				let responseData = { "status": false, "code": 401, "message": "Failed to activate Employee", "err" :  error}
				response.json(responseData)
			}
		});
	}else {
		let responseData = { "status": false, "code": 401, "message": "Please check details" }
		response.json(responseData)
		response.end();
	}
})
//SELECT u.id,u.client_id,u.name,u.username,u.email,u.mobile,lt.state_name,u.bucket_id,bl.bucket,lt.name as language_name FROM userdetails u JOIN user_known_languages ukl ON ukl.userId = u.id JOIN language_table lt ON lt.id = ukl.languageId JOIN bucket_list bl ON bl.id = u.bucket_id WHERE u.usertype = 0 AND u.active = 1

router.get('/getAllEmpList', function (request, response) {
	connection.query('SELECT u.id,u.client_id,u.name,u.username,u.email,u.mobile,u.bucket_id,u.active as status,bl.bucket,(NULL) as language_name FROM userdetails u JOIN bucket_list bl ON bl.id = u.bucket_id WHERE u.usertype = 0', function (error, results, fields) {
		if (results.length > 0) {
			//	request.session.loggedin = true;
			// request.session.username = username;
			let responseData = { "status": true, "code": 200, "userDetails": results }
			response.json(responseData)
		} else {
			let responseData = { "status": false, "code": 401, "userDetails": [] }
			response.json(responseData)
		}
		response.end();
	});

});
router.get('/getAllActiveEmpList', function (request, response) {
	connection.query('SELECT u.id,u.client_id,u.name,u.username,u.email,u.mobile,u.bucket_id,u.active as status,bl.bucket,GROUP_CONCAT(DISTINCT(LT.name)) as language_name FROM userdetails u LEFT JOIN bucket_list bl ON bl.id = u.bucket_id LEFT JOIN user_known_languages UKL ON UKL.userId = u.id LEFT JOIN language_table LT ON LT.id = UKL.languageId WHERE u.usertype = 0 AND u.active= "1" GROUP BY u.id', function (error, results, fields) {
		if (results.length > 0) {
			//	request.session.loggedin = true;
			// request.session.username = username;
			let responseData = { "status": true, "code": 200, "userDetails": results }
			response.json(responseData)
		} else {
			let responseData = { "status": false, "code": 401, "userDetails": [] }
			response.json(responseData)
		}
		response.end();
	});

});
router.get('/getAllALoanDetailsList', function (request, response) {
	connection.query('SELECT * FROM `loan_details` ld JOIN userdetails u Where u.id = ld.assigned_emp_id', function (error, results, fields) {
		if (results.length > 0) {
			//	request.session.loggedin = true;
			// request.session.username = username;
			let responseData = { "status": true, "code": 200, "assignedLoan": results }
			response.json(responseData)
		} else {
			let responseData = { "status": false, "code": 401, "assignedLoan": [] }
			response.json(responseData)
		}
		response.end();
	});

});
router.post('/getLoanListByEmp', function (request, response) {
	var empId = request.body.empId
	connection.query(`SELECT ld.*, LS.status_type as status FROM loan_details ld JOIN userdetails u on  u.id = ld.assigned_emp_id LEFT JOIN Loan_status LS ON ld.current_status = LS.id where u.id ='${empId}' AND ld.batch_status = 1 GROUP BY ld.id ORDER BY ld.current_status DESC`, function (error, results, fields) {
		if (results.length > 0) {
			//	request.session.loggedin = true;
			// request.session.username = username;
			let responseData = { "status": true, "code": 200, "assignedLoanToEmp": results }
			response.json(responseData)
		} else {
			let responseData = { "status": false, "code": 401, "assignedLoanToEmp": [] }
			response.json(responseData)
		}
		response.end();
	});

});
router.post('/assignLoanList', function (request, response) {
	 var empid = request.body.empId;
	 var loanid = request.body.loanId;
	// var selectedEmpid = request.body.assignedEmpId
	console.log(request.body)
	// var today = new Date();
	// var dd = today.getDate();
	// var mm = today.getMonth() + 1;
	// var yyyy = today.getFullYear();
	// if (dd < 10) {
	// 	dd = '0' + dd

	// } if (mm < 10) {

	// 	mm = '0' + mm
	// }
	// var today = yyyy + '-' + mm + '-' + dd;
	var queries='';
	loanid.map(lId => {
			queries += mysql.format(`UPDATE loan_details SET assigned_emp_id = '${empid}',is_assigned= '1' WHERE loan_id = '${lId}';`);
	});
	console.log(queries)
	connection.query(queries, (err, results, fields) => {
		if (results) {
			let responseData = { "status": true, "code": 200, "message": "Loan assigned successfully" }
			response.json(responseData)
		} else {
			let responseData = { "status": false, "code": 401, "message": "" }
			response.json(responseData)
		}
		response.end();
	});


});
// router.post('/assignLoanList', function (request, response) {
// 	var empid = request.body.empId;
// 	var loanid = request.body.loanId;
// 	var selectedEmpid = request.body.assignedEmpId
// 	console.log(loanid)
// 	var today = new Date();
// 	var dd = today.getDate();
// 	var mm = today.getMonth() + 1;
// 	var yyyy = today.getFullYear();
// 	if (dd < 10) {
// 		dd = '0' + dd

// 	} if (mm < 10) {

// 		mm = '0' + mm
// 	}
// 	var today = yyyy + '-' + mm + '-' + dd;
// 	let inserData = '';
// 	let queryTest
// 	let dontInsert;
// 	let startQuery = 'INSERT INTO Loan_log_table (emp_id,loan_id,date,active) VALUES'
// 	console.log(`update Loan_log_table SET active = 0 WHERE loan_id IN (${loanid})`)
// 	if (loanid) {
// 		connection.query(`update Loan_log_table SET active = 0 WHERE loan_id IN ('${loanid}')`, (er, res, field) => {
// 			console.log(res)
// 		})
// 	}
// 	loanid.map(lId => {
// 		currentRow = `('${empid}','${lId}','${today}','1'),`

// 		currentRow = currentRow.replace(/\n|\r/g, "");
// 		currentRow = currentRow.replace(/~+$/, '');

// 		inserData = inserData + currentRow
// 	});
// 	inserData = inserData.replace(/,\s*$/, "");
// 	console.log(inserData)
// 	queryTest = startQuery + inserData;

// 	connection.query(queryTest, (err, results, fields) => {
// 		if (results) {
// 			let responseData = { "status": true, "code": 200, "message": "Loan assigned successfully" }
// 			response.json(responseData)
// 		} else {
// 			let responseData = { "status": false, "code": 401, "message": "" }
// 			response.json(responseData)
// 		}
// 		response.end();
// 	});


// });

router.post('/updateLoan', function (request, response) {
	// console.log(request.body)
	if (request.body.loan_id && request.body.current_Status) {
		let currentDateTime = moment().format('YYYY-MM-DD hh:mm:ss')
		connection.query(`update loan_details set current_status ='${request.body.current_Status}',old_status ='${request.body.old_Status}',document='${request.body.document}',comments='${request.body.comment}', statusUpdateDate='${currentDateTime}' where loan_id = '${request.body.loan_id}'`, function (error, results, fields) {
			if (results) {
				let responseData = { "status": true, "code": 200, "message": "Loan Details updated successfully" }
				response.json(responseData)
			} else {
				let responseData = { "status": false, "code": 401, "message": "Failed to update loan Details", "err" :  error}
				response.json(responseData)
			}
		});
	}else{
		let responseData = { "status": false, "code": 401, "message": "Failed to update loan Details" }
		response.json(responseData)
	}
});
router.get('/getAllLoanDetailsList', function (request, response) {
	connection.query('SELECT * FROM loan_details WHERE batch_status = 1 ORDER BY is_assigned ASC', function (error, results, fields) {
		if (results.length > 0) {
			//	request.session.loggedin = true;
			// request.session.username = username;
			let responseData = { "status": true, "code": 200, "loanDetails": results }
			response.json(responseData)
		} else {
			let responseData = { "status": false, "code": 401, "loanDetails": [] }
			response.json(responseData)
		}
		response.end();
	});

});
router.get('/getAssignedLoanDetailsList', function (request, response) {
	connection.query('SELECT * FROM loan_details WHERE batch_status = 1 AND is_assigned = 1', function (error, results, fields) {
		if (results.length > 0) {
			//	request.session.loggedin = true;
			// request.session.username = username;
			let responseData = { "status": true, "code": 200, "loanDetails": results }
			response.json(responseData)
		} else {
			let responseData = { "status": false, "code": 401, "loanDetails": [] }
			response.json(responseData)
		}
		response.end();
	});

});
router.get('/getUnAssignedLoanDetailsList', function (request, response) {
	connection.query('SELECT * FROM loan_details WHERE batch_status = 1 AND is_assigned = 0', function (error, results, fields) {
		if (results.length > 0) {
			//	request.session.loggedin = true;
			// request.session.username = username;
			let responseData = { "status": true, "code": 200, "loanDetails": results }
			response.json(responseData)
		} else {
			let responseData = { "status": false, "code": 401, "loanDetails": [] }
			response.json(responseData)
		}
		response.end();
	});

});
router.get('/inactiveCurrentBatch', function (request, response) {
	connection.query('UPDATE loan_details SET `batch_status` = 0 WHERE `batch_status` = 1', function (error, results, fields) {
		let responseData = { "status": true, "code": 200, "message": "Current Batch Inactivated." }
		response.json(responseData)
	});

});

router.get('/getLoanStatus', function (request, response) {
	connection.query('SELECT * FROM Loan_status WHERE id!="6"', function (error, results, fields) {
		if (results.length > 0) {
			let responseData = { "status": true, "code": 200, "loanStatus": results }
			response.json(responseData)
		} else {
			let responseData = { "status": false, "code": 401, "loanStatus": [] }
			response.json(responseData)
		}
		response.end();
	});

});

var xyz = multer.diskStorage(
	{
		destination: './LeadExcels/',
		filename: function (request, file, cb) {
			cb(null, Date.now() + "-" + file.originalname);
		}
	}
);

const uploadx = multer({
	storage: xyz,
	fileFilter: function (req, file, callback) { //file filter
		console.log(file)
		if (['xls', 'xlsx'].indexOf(file.originalname.split('.')[file.originalname.split('.').length - 1]) === -1) {
			return callback(new Error('Wrong extension type'));
		}
		callback(null, true);
	}
}).single('leadExcel');

router.post("/uploadExcel", (request, response) => {
	// if(['xls', 'xlsx'].request.file.filename)
	// response.send("File "+request.file.filename+" uploaded successfully")
	var exceltojson; //Initialization
	uploadx(request, response, function (err) {
		if (err) {
			response.json({ error_code: 1, err_desc: err });
			return;
		}
		/** Multer gives us file info in req.file object */
		if (!request.file) {
			response.json({ error_code: 1, err_desc: "No file passed" });
			return;
		}
		//start convert process
		/** Check the extension of the incoming file and
		 *  use the appropriate module
		 */
		if (request.file.originalname.split('.')[request.file.originalname.split('.').length - 1] === 'xlsx') {
			exceltojson = xlsxtojson;
		} else {
			exceltojson = xlstojson;
		}
		try {
			exceltojson({
				input: request.file.path, //the same path where we uploaded our file
				output: null, //since we don't need output.json
				lowerCaseHeaders: true
			}, function (err, result) {
				if (err) {
					return response.json({ error_code: 1, err_desc: err, data: null });
				}
				response.json({ error_code: 0, err_desc: null, data: result, filename: request.file.originalname });
			});
		} catch (e) {
			response.json({ error_code: 1, err_desc: "Corupted excel file" });
		}
	});
})
router.post('/insertExcelOld', function (request, response) {
	// let responseData = { "status": true, "code": 200, "message": "Excel uploaded successfully" }
	// response.json(responseData)
	var loanDetails = request.body.loanDetails;
	var filename = request.body.filename;
	if (loanDetails == null) {
		let loanData = { "status": false, "code": 404, "message": "No Data" }
		response.json(loanData)
	} else {
		var today = new Date();
		var dd = today.getDate();
		var mm = today.getMonth() + 1;
		var yyyy = today.getFullYear();
		if (dd < 10) {
			dd = '0' + dd

		} if (mm < 10) {

			mm = '0' + mm
		}
		var today = yyyy + '-' + mm + '-' + dd;

		if (filename) {
			var file = {
				client_id: "1",
				filename: filename,
				date: today,
				active: '1'
			}
			connection.query('INSERT INTO imported_files SET ?', file, (err, results, fields) => {
			//	console.log(results.insertId)
				var lastinserttedId = results.insertId;
				let inserData = '';
				let queryTest
				let startQuery = "INSERT INTO `loan_details` (`client_id`,`imported_file_id`,`Customer_id`, `Loan_Count`, `loanid`, `customer_Name`, `Gender`, `mobile`,`email`, `DOB`, `Age`, `city`, `pin_code`, `state`, `loan_id`, `disbursal_amt`, `disbursal_date`,`due_date`, `principal_amt`, `interest_amount`, `penalty_amt`, `repayment_amt`, `ref_type1`, `ref_name1`, `ref_mobile_num1`, `ref_type2`, `ref_name2`, `ref_mobile_num2`, `bucket`,`overdue_days`, `is_collected`, `ESIGN_MOBILE_NUMBER`, `repaid_date`,`is_assigned`,`date`) VALUES";
				let duplicateColumn = "ON DUPLICATE KEY UPDATE `client_id`=VALUES(`client_id`),`imported_file_id`=VALUES(`imported_file_id`),`assigned_emp_id`=VALUES(`assigned_emp_id`),`Customer_id`=VALUES(`customer_id`), `Loan_Count`=VALUES(`loan_count`), `loanid`=VALUES(`loan_id`),`customer_Name`=VALUES(`customer_name`),`Gender`=VALUES(`gender`),`mobile`=VALUES(`mobile`),`email`=VALUES(`email`),`DOB`=VALUES(`dob`),`Age`=VALUES(`age`),`city`=VALUES(`city`) ,`pin_code`=VALUES(`pin_code`),`state`=VALUES(`state`),`loan_id`=VALUES(`loan_id`),`disbursal_amt`=VALUES(`disbursal_amt`),`disbursal_date`=VALUES(`disbursal_date`),`due_date`=VALUES(`due_date`),`principal_amt`=VALUES(`principal_amt`),`interest_amount`=VALUES(`interest_amount`),`penalty_amt`=VALUES(`penalty_amt`),`repayment_amt`=VALUES(`repayment_amt`),`ref_type1`=VALUES(`ref_type1`),`ref_name1`=VALUES(`ref_name1`),`ref_mobile_num1`=VALUES(`ref_mobile_num1`),`ref_type2`=VALUES(`ref_type2`),`ref_name2`=VALUES(`ref_name2`),`ref_mobile_num2`=VALUES(`ref_mobile_num2`),`bucket`=VALUES(`bucket`),`overdue_days`=VALUES(`overdue_days`),`is_collected`=VALUES(`is_collected`),`ESIGN_MOBILE_NUMBER`=VALUES(`esign_mobile_number`),`repaid_date`=VALUES(`repaid_date`),`is_assigned`=VALUES(`is_assigned`),`date`=VALUES(`date`)"
				let responseData;
				//console.log(loanDetails)
				loanDetails.map(item => {
					currentRow = `('1','${lastinserttedId}','${item.customer_id}','${item.loan_count}' ,'${item.loan_id}' ,'${item.customer_name}' , '${item.gender}',  '${item.mobile}','${item.email}' ,
					'${item.dob}' ,'${item.age}' ,'${item.city}' ,
					'${item.pin_code}' ,'${item.state}' ,'${item.loan_id}' ,'${item.disbursal_amt}','${item.disbursal_date}' ,'${item.due_date}' ,'${item.principal_amt}' ,
					'${item.interest_amount}' ,'${item.penalty_amt}' ,'${item.repayment_amt}' ,'${item.ref_type1}' , 
					'${item.ref_name1}','${item.ref_mobile_num1}' , '${item.ref_type2}','${item.ref_name2}' ,'${item.ref_mobile_num2}' ,
					'${item.bucket}' ,'${item.overdue_days}' , '${item.is_collected}',
					'${item.esign_mobile_number}' , '${item.repaid_date}','0','${today}'),`

					currentRow = currentRow.replace(/\n|\r/g, "");
					currentRow = currentRow.replace(/~+$/, '');

					inserData = inserData + currentRow
					// inserData = inserData.replace(/,\s*$/, "");
					//console.log(queryTest)
				});
				inserData = inserData.replace(/,\s*$/, "");
				queryTest = startQuery + inserData + duplicateColumn;
			//	console.log(queryTest)
				connection.query(queryTest, (err, results, fields) => {
				//	console.log(results)
					if (results) {
						//	request.session.loggedin = true;
						// request.session.username = username;
						let responseData = { "status": true, "code": 200, "message": "Excel uploaded successfully" }
						response.json(responseData)
					} else {
						let responseData = { "status": false, "code": 401, "message": "" }
						response.json(responseData)
					}
					response.end();
				});
				
			});
		}
	}
});

router.post('/insertExcel', function (request, response) {
	var loanDetails = request.body.loanDetails;
	var filename = request.body.filename;
	if (loanDetails == null) {
		let loanData = { "status": false, "code": 404, "message": "No Data" }
		response.json(loanData)
	} else {
		var today = new Date();
		var dd = today.getDate();
		var mm = today.getMonth() + 1;
		var yyyy = today.getFullYear();
		if (dd < 10) {
			dd = '0' + dd

		} if (mm < 10) {

			mm = '0' + mm
		}
		var today = yyyy + '-' + mm + '-' + dd;

		if (filename) {
			var file = {
				client_id: "1",
				filename: filename,
				date: today,
				active: '1'
			}
			connection.query('INSERT INTO imported_files SET ?', file, (err, results, fields) => {
				var lastinserttedId = results.insertId;
				let inserData = [];
				inserData[0] = ""
				let queryTest
				let startQuery = "INSERT INTO `loan_details` (`client_id`,`imported_file_id`,`Customer_id`, `Loan_Count`, `loanid`, `customer_Name`, `Gender`, `mobile`,`email`, `DOB`, `Age`, `city`, `pin_code`, `state`, `loan_id`, `disbursal_amt`, `disbursal_date`,`due_date`, `principal_amt`, `interest_amount`, `penalty_amt`, `repayment_amt`, `ref_type1`, `ref_name1`, `ref_mobile_num1`, `ref_type2`, `ref_name2`, `ref_mobile_num2`, `bucket`,`overdue_days`, `is_collected`, `ESIGN_MOBILE_NUMBER`, `repaid_date`,`is_assigned`,`date`, `batch_status`) VALUES";
				let duplicateColumn = "ON DUPLICATE KEY UPDATE `client_id`=VALUES(`client_id`),`imported_file_id`=VALUES(`imported_file_id`),`assigned_emp_id`=VALUES(`assigned_emp_id`),`Customer_id`=VALUES(`customer_id`), `Loan_Count`=VALUES(`loan_count`), `loanid`=VALUES(`loan_id`),`customer_Name`=VALUES(`customer_name`),`Gender`=VALUES(`gender`),`mobile`=VALUES(`mobile`),`email`=VALUES(`email`),`DOB`=VALUES(`dob`),`Age`=VALUES(`age`),`city`=VALUES(`city`) ,`pin_code`=VALUES(`pin_code`),`state`=VALUES(`state`),`loan_id`=VALUES(`loan_id`),`disbursal_amt`=VALUES(`disbursal_amt`),`disbursal_date`=VALUES(`disbursal_date`),`due_date`=VALUES(`due_date`),`principal_amt`=VALUES(`principal_amt`),`interest_amount`=VALUES(`interest_amount`),`penalty_amt`=VALUES(`penalty_amt`),`repayment_amt`=VALUES(`repayment_amt`),`ref_type1`=VALUES(`ref_type1`),`ref_name1`=VALUES(`ref_name1`),`ref_mobile_num1`=VALUES(`ref_mobile_num1`),`ref_type2`=VALUES(`ref_type2`),`ref_name2`=VALUES(`ref_name2`),`ref_mobile_num2`=VALUES(`ref_mobile_num2`),`bucket`=VALUES(`bucket`),`overdue_days`=VALUES(`overdue_days`),`is_collected`=VALUES(`is_collected`),`ESIGN_MOBILE_NUMBER`=VALUES(`esign_mobile_number`),`repaid_date`=VALUES(`repaid_date`),`is_assigned`=VALUES(`is_assigned`),`date`=VALUES(`date`), `batch_status` =VALUES(`batch_status`)"
				let responseData;
				let currentBatch = 0
				let rowCount = 0
				let allBatchSuccess = true
				loanDetails.map(item => {
					if(item.loan_id !=""){
						currentRow = `("1","${lastinserttedId}","${item.customer_id}","${item.loan_count}" ,"${item.loan_id}" ,"${item.customer_name}" , "${item.gender}",  "${item.mobile}","${item.email}" ,
						"${item.dob}" ,"${item.age}" ,"${item.city}" ,
						"${item.pin_code}" ,"${item.state}" ,"${item.loan_id}" ,"${item.disbursal_amt}","${item.disbursal_date}" ,"${item.due_date}" ,"${item.principal_amt}" ,
						"${item.interest_amount}" ,"${item.penalty_amt}" ,"${item.repayment_amt}" ,"${item.ref_type1}" , 
						"${item.ref_name1}","${item.ref_mobile_num1}" , "${item.ref_type2}","${item.ref_name2}" ,"${item.ref_mobile_num2}" ,
						"${item.bucket}" ,"${item.overdue_days}" , "${item.is_collected}",
						"${item.esign_mobile_number}" , "${item.repaid_date}","0","${today}", "1"),`

						currentRow = currentRow.replace(/\n|\r/g, "");
						currentRow = currentRow.replace(/~+$/, '');
						currentRow = currentRow.replace(/'/g, "''");
						
						inserData[currentBatch] = inserData[currentBatch] + currentRow

						if(rowCount == 1000){
							currentBatch = currentBatch + 1
							rowCount = 0
							inserData[currentBatch] = ""
						}
						rowCount = rowCount + 1
					}
				});
				inserData.map( (batch, key) => {
					inserData[key] = inserData[key].replace(/,\s*$/, "");
					queryTest = startQuery + inserData[key] + duplicateColumn;
					connection.query(queryTest, (err, results, fields) => {
						if(!results){
							allBatchSuccess = false
						}
					});
				})
				if(allBatchSuccess){
					let responseData = { "status": true, "code": 200, "message": "Excel uploaded successfully" }
					response.json(responseData)
					response.end()
				}else{
					let responseData = { "status": true, "code": 401, "message": "something went wrong" }
					response.json(responseData)
					response.end()
				}
			});
		}
	}
});

router.post('/uploadSingleEmployeeDetails', function (request, response) {
	var loanDetails = request.body.loanDetails;
	var filename = request.body.filename;
	var employeeID = request.body.employeeId
	if (loanDetails == null) {
		let loanData = { "status": false, "code": 404, "message": "No Data" }
		response.json(loanData)
	} else {
		var today = new Date();
		var dd = today.getDate();
		var mm = today.getMonth() + 1;
		var yyyy = today.getFullYear();
		if (dd < 10) {
			dd = '0' + dd

		} if (mm < 10) {

			mm = '0' + mm
		}
		var today = yyyy + '-' + mm + '-' + dd;

		if (filename) {
			var file = {
				client_id: "1",
				filename: filename,
				date: today,
				active: '1'
			}
			connection.query('INSERT INTO imported_files SET ?', file, (err, results, fields) => {
				var lastinserttedId = results.insertId;
				let inserData = [];
				inserData[0] = ""
				let queryTest
				let startQuery = "INSERT INTO `loan_details` (`client_id`,`imported_file_id`,`Customer_id`, `Loan_Count`, `loanid`, `customer_Name`, `Gender`, `mobile`,`email`, `DOB`, `Age`, `city`, `pin_code`, `state`, `loan_id`, `disbursal_amt`, `disbursal_date`,`due_date`, `principal_amt`, `interest_amount`, `penalty_amt`, `repayment_amt`, `ref_type1`, `ref_name1`, `ref_mobile_num1`, `ref_type2`, `ref_name2`, `ref_mobile_num2`, `bucket`,`overdue_days`, `is_collected`, `ESIGN_MOBILE_NUMBER`, `repaid_date`,`is_assigned`,`date`, `assigned_emp_id`) VALUES";
				let duplicateColumn = "ON DUPLICATE KEY UPDATE `client_id`=VALUES(`client_id`),`imported_file_id`=VALUES(`imported_file_id`),`assigned_emp_id`=VALUES(`assigned_emp_id`),`Customer_id`=VALUES(`customer_id`), `Loan_Count`=VALUES(`loan_count`), `loanid`=VALUES(`loan_id`),`customer_Name`=VALUES(`customer_name`),`Gender`=VALUES(`gender`),`mobile`=VALUES(`mobile`),`email`=VALUES(`email`),`DOB`=VALUES(`dob`),`Age`=VALUES(`age`),`city`=VALUES(`city`) ,`pin_code`=VALUES(`pin_code`),`state`=VALUES(`state`),`loan_id`=VALUES(`loan_id`),`disbursal_amt`=VALUES(`disbursal_amt`),`disbursal_date`=VALUES(`disbursal_date`),`due_date`=VALUES(`due_date`),`principal_amt`=VALUES(`principal_amt`),`interest_amount`=VALUES(`interest_amount`),`penalty_amt`=VALUES(`penalty_amt`),`repayment_amt`=VALUES(`repayment_amt`),`ref_type1`=VALUES(`ref_type1`),`ref_name1`=VALUES(`ref_name1`),`ref_mobile_num1`=VALUES(`ref_mobile_num1`),`ref_type2`=VALUES(`ref_type2`),`ref_name2`=VALUES(`ref_name2`),`ref_mobile_num2`=VALUES(`ref_mobile_num2`),`bucket`=VALUES(`bucket`),`overdue_days`=VALUES(`overdue_days`),`is_collected`=VALUES(`is_collected`),`ESIGN_MOBILE_NUMBER`=VALUES(`esign_mobile_number`),`repaid_date`=VALUES(`repaid_date`),`is_assigned`=VALUES(`is_assigned`),`date`=VALUES(`date`)"
				let responseData;
				let currentBatch = 0
				let rowCount = 0
				let allBatchSuccess = true
				loanDetails.map(item => {
					currentRow = `("1","${lastinserttedId}","${item.customer_id}","${item.loan_count}" ,"${item.loan_id}" ,"${item.customer_name}" , "${item.gender}",  "${item.mobile}","${item.email}" ,
					"${item.dob}" ,"${item.age}" ,"${item.city}" ,
					"${item.pin_code}" ,"${item.state}" ,"${item.loan_id}" ,"${item.disbursal_amt}","${item.disbursal_date}" ,"${item.due_date}" ,"${item.principal_amt}" ,
					"${item.interest_amount}" ,"${item.penalty_amt}" ,"${item.repayment_amt}" ,"${item.ref_type1}" , 
					"${item.ref_name1}","${item.ref_mobile_num1}" , "${item.ref_type2}","${item.ref_name2}" ,"${item.ref_mobile_num2}" ,
					"${item.bucket}" ,"${item.overdue_days}" , "${item.is_collected}",
					"${item.esign_mobile_number}" , "${item.repaid_date}","1","${today}","${employeeID}"),`

					currentRow = currentRow.replace(/\n|\r/g, "");
					currentRow = currentRow.replace(/~+$/, '');
					currentRow = currentRow.replace(/'/g, "''");
					
					inserData[currentBatch] = inserData[currentBatch] + currentRow

					if(rowCount == 1000){
						currentBatch = currentBatch + 1
						rowCount = 0
						inserData[currentBatch] = ""
					}
					rowCount = rowCount + 1
				});
				inserData.map( (batch, key) => {
					inserData[key] = inserData[key].replace(/,\s*$/, "");
					queryTest = startQuery + inserData[key] + duplicateColumn;
					connection.query(queryTest, (err, results, fields) => {
						if(!results){
							allBatchSuccess = false
						}
					});
				})
				if(allBatchSuccess){
					let responseData = { "status": true, "code": 200, "message": "Excel uploaded successfully" }
					response.json(responseData)
					response.end()
				}else{
					let responseData = { "status": true, "code": 401, "message": "something went wrong" }
					response.json(responseData)
					response.end()
				}
			});
		}
	}
});

router.post('/updateOldLoanDetails', function (request, response) {
	var ldata = request.body.loanupdateData;
	console.log(ldata)
	// var emp_id = request.body.empid;
	// var is_assigned = request.body.is_assigned;
	//console.log("update")
	if (ldata) {
		var queries='';
		ldata.map(item=>{
			queries += mysql.format(`UPDATE loan_details SET Loan_Count = '${item.loan_count}',customer_Name= '${item.customer_name}',Gender= '${item.gender}',mobile= '${item.mobile}',email= '${item.email}',DOB= '${item.dob}',Age= '${item.age}',city= '${item.city}',pin_code= '${item.pin_code}' ,state= '${item.state}'  ,disbursal_amt= '${item.disbursal_amt}',disbursal_date= '${item.disbursal_date}'
			,due_date= '${item.due_date}' ,principal_amt= '${item.principal_amt}' ,interest_amount= '${item.interest_amount}'
			,penalty_amt= '${item.penalty_amt}',repayment_amt= '${item.repayment_amt}'  ,ref_type1= '${item.ref_type1}' ,ref_mobile_num1= '${item.ref_mobile_num1}'
			,ref_type2= '${item.ref_type2}',ref_name2= '${item.ref_name2}',bucket= '${item.bucket}',overdue_days= '${item.overdue_days}'
			,is_collected= '${item.is_collected}',ESIGN_MOBILE_NUMBER= '${item.esign_mobile_number}'
			WHERE loan_id = '${item.loan_id}';`);
			
		})
		console.log(queries)
		connection.query(queries, function (error, results, fields) {
			console.log(results)

			if (results) {
				let responseData = { "status": true, "code": 200, "message": "Loan Details updated successfully" }
				response.json(responseData)
			} else {
				let responseData = { "status": false, "code": 401, "message": "Failed to update loan Details" }
				response.json(responseData)
			}
		});
	}

})
router.post('/updateRepaymentStatus', function (request, response) {
	var ldata = request.body.repymentData;
	if (ldata) {
		var queries='';
		ldata.map(item=>{
			queries += mysql.format(`UPDATE loan_details SET current_status = '6' WHERE loan_id = '${item.loan_id}';`);
			
		})
		// console.log(queries)
		connection.query(queries, function (error, results, fields) {
			// console.log(results)
			if (results) {
				let responseData = { "status": true, "code": 200, "message": "Loan Details updated successfully" }
				response.json(responseData)
			} else {
				let responseData = { "status": false, "code": 401, "message": "Failed to update loan Details", "err" : error }
				response.json(responseData)
			}
		});
	}

})
router.post('/updateLoanDetails', function (request, response) {
	var ldata = request.body.loanupdateData;
	if (ldata) {
		let startQuery = "UPDATE loan_details SET "
		let col1Start = "assigned_emp_id = (CASE loan_id "
		let col1Values = ""
		let col1End = "END) "
		let col2Start = "is_assigned = (CASE loan_id "
		let col2Values = ""
		let col2End = "END) "
		let endQuery = "WHERE loan_id IN("
		let endValues = ""
		ldata.map(item => {
			col1Values += `WHEN '${item.loan_id}' THEN '${item.assigned_emp_id}' `
			col2Values += `WHEN '${item.loan_id}' THEN 1 `
			endValues += `${item.loan_id},`
		})
		let col1 = col1Start+col1Values+col1End
		let col2 = col2Start+col2Values+col2End
		endValues = endValues.slice(0, -1)
		endQuery = endQuery+endValues+")"
		updateQuery = startQuery+col1+","+col2+endQuery
		if(endValues!=""){
			connection.query(updateQuery, function (error, results, fields) {
				if (results) {
					let responseData = { "status": true, "code": 200, "message": "Loan Details updated successfully" }
					response.json(responseData)
				} else {
					let responseData = { "status": false, "code": 401, "message": "Failed to update loan Details", "err" : error }
					response.json(responseData)
				}
			});
		}else{
			let responseData = { "status": true, "code": 200, "message": "Loan Details updated successfully" }
			response.json(responseData)
		}
	}

})
var fileupload = multer.diskStorage(
	{
		destination: './files/',
		filename: function (request, file, cb) {
			cb(null, Date.now() + "-" + file.originalname);
		}
	}
);

const uploadFiles = multer({ storage: fileupload })

router.post("/uploadFile", uploadFiles.single('files'), (request, response) => {
	// let responseData = { "status": true, "code": 200, "file": request }
	// 	response.json(responseData)
	response.send(request.file.filename)

})

router.get('/getBucketList', function (request, response) {
	connection.query('SELECT * FROM bucket_list ', function (error, results, fields) {
		if (results.length > 0) {
			let responseData = { "status": true, "code": 200, "bucketList": results }
			response.json(responseData)
		} else {
			let responseData = { "status": false, "code": 401, "bucketList": [] }
			response.json(responseData)
		}
		response.end();
	});

});

router.get('/getAllLanguage', function (request, response) {
	connection.query('SELECT * FROM language_table ', function (error, results, fields) {
		if (results.length > 0) {
			let responseData = { "status": true, "code": 200, "languageList": results }
			response.json(responseData)
		} else {
			let responseData = { "status": false, "code": 401, "languageList": [] }
			response.json(responseData)
		}
		response.end();
	});

});

router.get('/getUsersWithKnownLanguages', function (request, response) {
	connection.query('SELECT UKL.userId, UKL.languageId as language_id, LT.name as language_name, UD.email, UD.id, UD.mobile, UD.name, UD.bucket_id, LT.state_name, UD.client_id, BL.bucket as bucket, UD.username FROM user_known_languages UKL JOIN userdetails UD ON UKL.userId = UD.id JOIN language_table LT ON UKL.languageId = LT.id JOIN bucket_list BL ON BL.id = UD.bucket_id WHERE UD.active = 1', function (error, results, fields) {
		// console.log(results)
		if (results.length > 0) {
			let responseData = { "status": true, "code": 200, "languageList": results }
			response.json(responseData)
		} else {
			let responseData = { "status": false, "code": 401, "languageList": [] }
			response.json(responseData)
		}
		response.end();
	});
});

router.get('/getDayReport', function (request, response) {
	connection.query('SELECT UD.id, UD.name as employeeName, UD.username as employeeID, COALESCE(SUM(LD.repayment_amt), 0) as assignedAmount, COUNT(LD.repayment_amt) as assignedAmount_COUNT, COALESCE(SUM(CASE WHEN LD.current_status = 1 THEN LD.repayment_amt END), 0) as PTP_AMOUNT, COUNT(CASE WHEN LD.current_status = 1 THEN LD.current_status ELSE NULL END) as PTP_AMOUNT_COUNT, COALESCE(SUM(CASE WHEN LD.current_status = 2 THEN LD.repayment_amt END), 0) as RNR_AMOUNT, COUNT(CASE WHEN LD.current_status = 2 THEN LD.current_status ELSE NULL END) as RNR_AMOUNT_COUNT, COALESCE(SUM(CASE WHEN LD.current_status = 3 THEN LD.repayment_amt END), 0) as SWITCH_OFF, COUNT(CASE WHEN LD.current_status = 3 THEN LD.current_status ELSE NULL END) as SWITCH_OFF_COUNT, COALESCE(SUM(CASE WHEN LD.current_status = 4 THEN LD.repayment_amt END), 0) as PAYMENT_EXPECTED_AT, COUNT(CASE WHEN LD.current_status = 4 THEN LD.current_status ELSE NULL END) as PAYMENT_EXPECTED_AT_COUNT, COALESCE(SUM(CASE WHEN LD.current_status = 5 THEN LD.repayment_amt END), 0) as WAITING_FOR_CONFIRMATION, COUNT(CASE WHEN LD.current_status = 5 THEN LD.current_status ELSE NULL END) as WAITING_FOR_CONFIRMATION_COUNT, COALESCE(SUM(CASE WHEN LD.current_status = 6 THEN LD.repayment_amt END), 0) as collectedAmout, COUNT(CASE WHEN LD.current_status = 6 THEN LD.current_status ELSE NULL END) as collectedAmout_COUNT, COALESCE(COALESCE(SUM(LD.repayment_amt), 0) - COALESCE(SUM(CASE WHEN LD.current_status = 5 THEN LD.repayment_amt END), 0)) as remainingAmount, (COUNT(LD.repayment_amt) - COUNT(CASE WHEN LD.current_status = 6 THEN LD.current_status ELSE NULL END)) as remainingAmount_COUNT, COALESCE(((COALESCE(SUM(CASE WHEN LD.current_status = 6 THEN LD.repayment_amt END), 0) / COALESCE(SUM(LD.repayment_amt), 0)) * 100), 0) as inPercentage FROM userdetails UD LEFT JOIN loan_details LD ON UD.id = LD.assigned_emp_id AND LD.batch_status = 1 WHERE UD.usertype = 0 AND UD.active = 1 GROUP BY UD.id', function (error, results, fields) {
		if (results.length > 0) {
			let responseData = { "status": true, "code": 200, "reportData": results }
			response.json(responseData)
		} else {
			let responseData = { "status": false, "code": 401, "reportData": [] }
			response.json(responseData)
		}
		response.end();
	});
});

router.get('/getCurrentDetailedReportsDataForExcel', function (request, response) {
	connection.query('SELECT LD.*,UD.username as employeeName, LS.status_type as loanStatus, LT.name as language FROM loan_details LD LEFT JOIN userdetails UD ON LD.assigned_emp_id = UD.id LEFT JOIN Loan_status LS ON LD.current_status = LS.id LEFT JOIN language_table LT ON LOWER(LD.state) = LOWER(LT.state_name) WHERE LD.batch_status = 1 AND LD.is_assigned = 1 GROUP BY LD.id', function (error, results, fields) {
		if (results.length > 0) {
			//	request.session.loggedin = true;
			// request.session.username = username;
			let responseData = { "status": true, "code": 200, "loanDetails": results }
			response.json(responseData)
		} else {
			let responseData = { "status": false, "code": 401, "loanDetails": [] }
			response.json(responseData)
		}
		response.end();
	});

});

router.post('/getEmployeeLanguages', function (request, response) {
	var empid = request.body.empid;
	if(empid){
		connection.query(`SELECT UKL.languageId as id, LT.name as language FROM user_known_languages UKL JOIN language_table LT ON UKL.languageId = LT.id WHERE UKL.userId = '${empid}' GROUP BY LT.name`, function (error, results, fields) {
			if (results) {
				let responseData = { "status": true, "code": 200, "languages": results }
				response.json(responseData)
			} else {
				let responseData = { "status": false, "code": 401, "message": "Failed to Fetch Details Employee", "err" :  error}
				response.json(responseData)
			}
		});
	}else {
		let responseData = { "status": false, "code": 401, "message": "Please check details" }
		response.json(responseData)
		response.end();
	}
});
module.exports = router