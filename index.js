const express = require("express");
const dateTime = require("./dateTime");
const fs = require("fs");
//et saada kõik pärignust kätte
const bodyparser = require("body-parser");
//andmebaasi andmed
const dbInfo = require("../../vp2024config");
//andmebaasiga suhtlemine
const mysql = require("mysql2");

const app = express();

//määran viev mootori
app.set("view engine", "ejs");
//määran jagatavate, avalike failide kausta
app.use(express.static("public"));
//kasutame body-parserit päringute parsimiseks (kui ainult tekst, siis false, kui ka pildid jms, siis true)
app.use(bodyparser.urlencoded({extended: false}));

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
		console.log("Külastuste logi:", visits); // Logige külastuste andmed konsooli
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

app.get("/regvisitdb", (req, res)=>{
	//loon andmebaasi päringu
	let sqlReq = "SELECT first_name, last_name, visit_date FROM person";
	conn.query(sqlReq, (err, sqlRes)=>{
		if (err){
			res.render("/regvisitdb",{persons: []});
			//throw err;
		}
		else{
			//console.log(sqlRes);
			res.render("/regvisitdb",{persons: sqlRes});
		}
	});
	//res.render("/regvisitdb");
});

app.get("/eestifilm", (req, res)=>{
	res.render("eestifilm");
});

app.get("/eestifilm/tegelased", (req, res)=>{
	//loon andmebaasi päringu
	let sqlReq = "SELECT first_name, last_name, birth_date FROM person";
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

app.get("/eestifilm/lisa", (req, res)=>{
	res.render("addperson");
});




app.listen(5212);