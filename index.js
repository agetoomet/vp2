const express = require("express");
const dateTime = require("./dateTime");
const fs = require("fs");
//et saada kõik pärignust kätte
const bodyparser = require("body-parser");
//andmebaasi andmed
const dbInfo = require("../../vp2024config");
//andmebaasiga suhtlemine
const mysql = require("mysql2");
//Fotode üleslaadimiseks
const multer = require("multer");
//foto manipulatsiooniks
const sharp = require("sharp");
//paroolide krüpteerimiseks
const bcrypt = require("bcrypt");
//sessioonihaldur
const session = require("express-session");
//asünkroonsuse võimaldaja
const asyn = require("async");

const app = express();

//määran viev mootori
app.set("view engine", "ejs");
//määran jagatavate, avalike failide kausta
app.use(express.static("public"));
//kasutame body-parserit päringute parsimiseks (kui ainult tekst, siis false, kui ka pildid jms, siis true)
app.use(bodyparser.urlencoded({extended: true}));
//seadistame fotode üleslaadimiseks vahevara (middleware), mis määrab kataloogi, kuhu laetakse
const upload = multer({dest: "./public/gallery/orig"});
//sessioonihaldur
app.use(session({secret: "minuAbsoluutseltSalajaneVõti", saveUninitialized: true, resave: true}));
let mySession;

//loon andmebaasi ühenduse
const conn = mysql.createConnection({
	host: dbInfo.configData.host,
	user: dbInfo.configData.user,
	password: dbInfo.configData.passWord,
	database: dbInfo.configData.dataBase
});

app.get("/", (req, res)=>{
	//res.send("Express läks käima!");
	//console.log(dbInfo.configData.host);
	res.render("index");
});

app.post("/", (req, res)=>{
	let notice = null;
	if(!req.body.emailInput || !req.body.passwordInput){
		console.log("Sisselogimise andmed pole täielikud!");
		notice = "Sisselogimise andmeid on puudu!";
		res.render("index", {notice: notice});
	}
	else {
		let sqlReq = "SELECT id, password FROM vp2users WHERE email = ?";
		conn.execute(sqlReq, [req.body.emailInput], (err, result)=>{
			if(err){
				notice = "Tehnilise vea tõttu ei saa sisselogida!";
				console.log(err);
				res.render("index", {notice: notice});
			}
			else {
				if(result[0] != null){
					//kontrollime, kas sisselogimisel sisestatud paroolist saaks sellise räsi nagu andmebaasis
					bcrypt.compare(req.body.passwordInput, result[0].password, (err,comprareresult)=>{
						if(err){
							notice = "Tehnilise vea tõttu andmete kontrollimisel ei saa sisselogida!";
							console.log(err);
							res.render("index", {notice: notice});
						}
						else {
							//kui võrdlus tulemus on positiivne
							if(comprareresult){
								notice = "Oledki sisse loginud!";
								//võtame sessiooni kasutusele
								mySession = req.session;
								mySession.userId = result[0].id;
								//res.render("index", {notice: notice});
								res.redirect("/home");
							}
							else {
								notice = "Kasutajatunnus ja/või parool oli vale!";
								res.render("index", {notice: notice});
							}
						}
					});
					
				}
				else {
					notice = "Kasutajatunnus või parool oli vale!";
					res.render("index", {notice: notice});
				}
			}
		});
	}
	//res.render("index");
});

app.get("/logout", (req, res)=>{
	req.session.destroy();
	mySession = null
	res.redirect("/");
});

app.get("/home", checkLogin, (req, res)=>{
	console.log("Sisse on loginud kasutaja: " + mySession.userId);
	res.render("home");
});

app.get("/signup", (req, res)=>{
	res.render("signup");
});

app.post("/signup", (req, res)=>{
	let notice = "Ootan andmeid";
	if(!req.body.firstNameInput || !req.body.lastNameInput || !req.body.birthDateInput || !req.body.genderInput || !req.body.emailInput || req.body.passwordInput.length < 8 || req.body.passwordInput !== req.body.confirmPasswordInput){
		console.log("Andmeid on puudu või paroolid ei klapi!");
		notice = "Andmeid on puudu või paroolid ei kattu!";
		res.render("signup", {notice: notice});
	}
	else {
		let sqlReq = "SELECT id, email FROM vp2users WHERE email = ?";
		conn.execute(sqlReq, [req.body.emailInput], (err, result)=>{
			if(err){
				console.log("Tehinilise veatõttu ei saanud andmebaasiga ühendust!");
				notice = "Tehinilise veatõttu ei saanud andmebaasiga ühendust!";
				res.render("signup", {notice: notice});
			}
			else if(result.length > 0){
				console.log("Sellise email-iga kasutaja on juba olemas!");
				notice = "Sellise email-iga kasutaja on juba olemas!";
				return res.render("signup", {
					notice: notice,
					firstNameInput: req.body.firstNameInput,
					lastNameInput: req.body.lastNameInput,
					birthDateInput: req.body.birthDateInput,
					emailInput: req.body.emailInput
				});
			}
			else {
				notice = "Andmed on korras!";
				bcrypt.genSalt(10, (err, salt)=>{
					if (err){
						notice = "Tehiniline viga, kasutajat ei loodud!";
						res.render("signup", {notice: notice});
					}
					else {
						bcrypt.hash(req.body.passwordInput, salt, (err, pwdHash)=>{
							if(err){
								notice = "Tehiniline viga parooli krüpteerimisel, kasutajat ei loodud!";
								res.render("signup", {notice: notice});
							}
							else {
								let sqlReq = "INSERT INTO vp2users (first_name, last_name, birth_date, gender, email, password) VALUES (?,?,?,?,?,?)";
								conn.execute(sqlReq, [req.body.firstNameInput, req.body.lastNameInput, req.body.birthDateInput, req.body.genderInput, req.body.emailInput, pwdHash], (err, result)=>{
									if(err){
										notice = "Tehiniline viga andmabaasi kirjutamisel, kasutajat ei loodud!";
										res.render("signup", {notice: notice});
									}
									else {
										notice = "Kasutaja " + req.body.emailInput + " edukalt loodud!";
										res.render("signup", {notice: notice});
									}
								});
							}
						});
					}
				});
			//res.render("signup", {notice: notice});
			}
		});
	}
	//res.render("signup");
});

app.get("/timenow", (req, res)=>{
	const weekdayNow = dateTime.dayFormatted();
	const dateNow = dateTime.dateFormatted();
	const timeNow = dateTime.timeFormatted();
	res.render("timenow", {nowWD: weekdayNow, nowD: dateNow, nowT: timeNow});
});

app.get("/vanasonad", (req, res) => {
    let folkWisdom = [];
    fs.readFile("public/textfiles/vanasonad.txt", "utf8", (err, data) => {
        if (err) {
            res.render("justlist", { h2: "Vanasõnad", listData: ["Ei leidnud midagi!"] });
        } else {
            folkWisdom = data.split(";");
            res.render("justlist", { h2: "Vanasõnad", listData: folkWisdom });
        }
    });
});

app.get("/regvisit", (req, res)=>{
	const weekdayNow = dateTime.dayFormatted();
    const dateNow = dateTime.dateFormatted();
    const timeNow = dateTime.timeFormatted();

	res.render("regvisit", {
		nowWD: weekdayNow,
		nowD: dateNow,
		nowT: timeNow
	});
});

app.post("/regvisit", (req, res)=>{
	//console.log(req.body);
	const weekdayNow = dateTime.dayFormatted();
    const dateNow = dateTime.dateFormatted();
    const timeNow = dateTime.timeFormatted();

    // Logime kasutaja sisestatud andmed koos kuupäeva ja kellaajaga
    const logEntry = `${req.body.firstNameInput} ${req.body.lastNameInput}; ${weekdayNow}, ${dateNow}, ${timeNow}\n`;
	//avan txt faili selliselt, et kui seda pole olemas luuakse
	fs.open("public/textfiles/log.txt", "a", (err, file)=>{
		if(err){
			throw err;
		}
		else {
			fs.appendFile("public/textfiles/log.txt", logEntry, (err)=>{
				if(err){
					throw err;
				}
				else {
					console.log("Faili kirjutati!");
					
					res.render("regvisit", {
						nowWD: weekdayNow,
						nowD: dateNow,
						nowT: timeNow
					});
				}
			});
		}
	});
	//res.render("regvisit");
});

app.get("/visitlog", (req, res) => {
    fs.readFile("public/textfiles/log.txt", "utf8", (err, data) => {
        if (err) {
            return res.render("justlist", { h2: "Registreeritud külastajad", listData: ["Ei leidnud logifaili!"] });
        }
        
        const visits = data.trim().split("\n").filter(entry => entry.length > 0);
		//console.log("Külastuste logi:", visits); // Logige külastuste andmed konsooli
        res.render("justlist", { h2: "Registreeritud külastajad", listData: visits });
    });
});

app.get("/regvisitdb", (req, res)=>{
	let notice = "";
	let firstName = "";
	let lastName = "";
	res.render("regvisitdb", {notice: notice, firstName: firstName, lastName: lastName});
});

app.post("/regvisitdb", (req, res)=>{
	let notice = "";
	let firstName = "";
	let lastName = "";
	//kontrollin kas kõik vajalikud andmed on olemas
	if(!req.body.firstNameInput || !req.body.lastNameInput){
		//console.log("Osa andmeid puudu");
		notice = "Osa andmeid puudu";
		firstName = req.body.firstNameInput;
		lastName = req.body.lastNameInput;
		res.render("regvisitdb", {notice: notice, firstName: firstName, lastName: lastName});
	}
	else {
		let sqlReq = "INSERT INTO vp2visitlog (first_name, last_name) VALUES (?,?)";
		conn.query(sqlReq, [req.body.firstNameInput, req.body.lastNameInput], (err, sqlRes)=>{
			if(err){
				notice = "Tehnilistel põhjustel andmeid ei salvestatud!";
				res.render("regvisitdb", {notice: notice, firstName: firstName, lastName: lastName});
				throw err;
			}
			else{
				//notice = "Andmeid salvestati";
				//res.render("regvisitdb", {notice: notice, firstName: firstName, lastName: lastName});
				res.redirect("/");
			}
		});
	}
});	

app.get("/visitlogdb", (req, res)=>{
	//console.log("Route /visitlogdb accessed");
	//loon andmebaasi päringu
	let sqlReq = "SELECT first_name, last_name, visit_date FROM vp2visitlog";
	conn.query(sqlReq, (err, sqlRes)=>{
		if (err){
			//console.error("Database query error:", err);
			res.render("visitlogdb",{listData: []});
			//throw err;
		}
		else{
			//console.log(sqlRes);
			res.render("visitlogdb",{listData: sqlRes});
		}
	});
	//res.render("regvisitdb");
});

app.get("/eestifilm", (req, res)=>{
	res.render("eestifilm");
});

app.get("/eestifilm/tegelased", (req, res)=>{
	//loon andmebaasi päringu
	let sqlReq = "SELECT id, first_name, last_name, birth_date FROM person";
	conn.query(sqlReq, (err, sqlRes)=>{
		if (err){
			res.render("tegelased",{persons: []});
			//throw err;
		}
		else{
			//console.log(sqlRes);
			res.render("tegelased",{persons: sqlRes});
		}
	});
	//res.render("tegelased");
});

app.get("/eestifilm/personrelations/:id", (req, res)=>{
	console.log(req.paramas);
	let sqlReq = "SELECT id, first_name, last_name, birth_date FROM person";
	conn.query(sqlReq, (err, sqlRes)=>{
		if (err){
			res.render("personrelations",{personrelations: []});
			//throw err;
		}
		else{
			//console.log(sqlRes);
			res.render("personrelations",{personrelations: sqlRes});
		}
	});
	//res.render("personrelations");
});

app.get("/eestifilm/addperson", (req, res)=>{
	res.render("addperson");
});

app.post("/eestifilm/addperson", (req, res)=>{
	let notice = "";
	
	if (req.body.filmSubmit){
		const filmName = req.body.filmInput;
        console.log("Lisati film:", filmName);
        notice = "Lisati film: ${filmName}";

	}
	else if (req.body.roleSubmit){
		const roleName = req.body.roleInput;
        console.log("Lisati roll:", roleName);
        notice = "Lisati roll: ${roleName}";
	}
	else {
		const firstName = req.body.firstNameInput;
        const lastName = req.body.lastNameInput;    
        console.log("Lisati filmitegelane:", firstName, lastName);
        notice = "Lisati filmitegelane: ${firstName} ${lastName}";
	}
	return res.render("addperson", {notice: notice});
	
});

app.get("/eestifilm/lisaseos", (req, res)=>{
	//kasutades async moodulit, panen mitu andmebaasipäringut paralleelselt toimima
	//loon sql päringute (lausa tegevust eehk funktsioonide)loendi
	const myQueries = [
		function(callback){
			conn.execute("SELECT id, first_name, last_name, birth_date FROM person", (err, result)=>{
				if(err){
					return callback(err);
				}
				else{
					return callback(null, result);
				}
			});
		},
		function(callback){
			conn.execute("SELECT id, title, production_year FROM movie", (err, result)=>{
				if(err){
					return callback(err);
				}
				else{
					return callback(null, result);
				}
			});
		},
		function(callback){
			conn.execute("SELECT id, position_name FROM position", (err, result)=>{
				if(err){
					return callback(err);
				}
				else{
					return callback(null, result);
				}
			});
		}
	];
	//paneme need tegeuved paralleelselt tööle, tulemuse saab siis, kui kõik tehtud
	//väljundiks üks koondlist
	asyn.parallel(myQueries, (err, results)=>{
		if(err){
			throw err;
		}
		else{
			console.log(results);
			res.render("addrelations", {personList: results[0], movieList: results[1], positionList: results[2]});
		}
	});
	/* let sqlReq = "SELECT id, first_name, last_name, birth_date FROM person";
	conn.execute(sqlReq, (err, result)=>{
		if(err){
			throw err;
		}
		else{
			console.log(result);
		res.render("addrelations", {personList: result});
		}
	}); */
	//res.render("addrelations");
});

app.get("/photoupload", (req, res)=>{
	res.render("photoupload");
});

app.post("/photoupload", upload.single("photoInput"), (req, res)=>{
	console.log(req.body);
	console.log(req.file);
	const fileName = "vp_" + Date.now() + ".jpg";
	fs.rename(req.file.path, req.file.destination + "/" + fileName, (err)=>{
		console.log("Faili nime muutmise viga: " + err);
	});
	sharp(req.file.destination + "/" + fileName).resize(800,600).jpeg({quality: 90}).toFile("./public/gallery/normal/" + fileName);
	sharp(req.file.destination + "/" + fileName).resize(100,100).jpeg({quality: 90}).toFile("./public/gallery/thumb/" + fileName);
	//salvestame info andmebaasi
	let sqlReq = "INSERT INTO vp2photos (file_name, orig_name, alt_text, privacy, user_id) VALUES(?,?,?,?,?)";
	const userId = 1;
	conn.query(sqlReq, [fileName, req.file.originalname, req.body.altInput, req.body.privacyInput, userId], (err, result)=>{
		if(err){
			throw(err);
		}
		else {
			res.render("photoupload");
		}
	});
	
});

app.get("/gallery", (req, res)=>{
	//loon andmebaasi päringu
	let sqlReq = "SELECT id, file_name, alt_text FROM vp2photos WHERE privacy = ? AND deleted IS NULL ORDER BY id DESC";
	const privacy = 3;
	let photoList = [];
	
	conn.execute(sqlReq, [privacy], (err, result)=>{
		if (err){
			throw (err);
		}
		else{
			console.log(result);
			for(let i = 0; i < result.length; i ++) {
				photoList.push({id: result[i].id, href:"/gallery/thumb/", filename: result[i].file_name, alt: result[i].alt_text});
			}
			res.render("gallery",{listData: photoList});
		}
	});
	
});

function checkLogin(req, res, next){
	if(mySession != null){
		if(mySession.userId){
			console.log("Login ok!");
			next();
		}
		else {
			console.log("Login not detected!");
			res.redirect("/");
		}
	}
	else {
		res.redirect("/");
	}
}

app.listen(5212);