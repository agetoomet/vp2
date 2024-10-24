const dayNamesEt = ["pühapäev", "esmaspäev", "teisipäev", "kolmapäev", "neljapäev", "reede", "laupäev"];
const monthNamesEt = ["jaanuar", "veebruar","märts", "aprill", "mai", "juuni", "juuli", "august", "september", "oktoober", "november", "detseber"]; 
const dateFormatted = function(){	
	//function dateFormatted(){
	let timeNow = new Date();
	let dateNow = timeNow.getDate();
	let monthNow = timeNow.getMonth();
	let yearNow = timeNow.getFullYear();
	
	//console.log("Täna on: " + dateNow + "." + (monthNow + 1) + "." + yearNow);
	//let dateEt = dateNow + ". " + monthNamesEt[monthNow] + " " + yearNow;
	//return dateEt;
	return dateNow + ". " + monthNamesEt[monthNow] + " " + yearNow;
} 

const dayFormatted = function(){
	let timeNow = new Date();
	let dayNow = timeNow.getDay();
	let dayEt = dayNamesEt[dayNow];
	return dayEt;
}

const timeFormatted = function(){
	let timeNow = new Date();
	let hourNow = timeNow.getHours();
	let minutesNow = timeNow.getMinutes();
	let secondsNow = timeNow.getSeconds();
	let timeEt = hourNow + ":" + minutesNow + ":" + secondsNow;
	return timeEt;
}

const partOfDay = function (){
	let dPart = "lihtsalt aeg";
	let dayNow = new Date ().getDay();
	let dayNameNow = dayNamesEt[dayNow]
	let hourNow = new Date ().getHours();
	// OR || AND &&
	// >  <    >=   <=  !=   ==    ===
	if (dayNameNow === "pühapäev" || dayNameNow === "laupäev"){
		console.log("Täna on nädalavahetus: " + dayNameNow);
				if (dayNameNow === "pühapäev"){
			if ( hourNow < 9){
				dPart = "uneaeg";
			} else if (hourNow > 10 && hourNow < 13){
				dPart = "õppimise aeg";
			} else if (hourNow >= 13 && hourNow <= 19){
				dPart = "töö";
			} else {
				dPart = "vaba aeg";
			}
		} else if (dayNameNow === "laupäev"){
			if (hourNow >= 10 && hourNow < 19){
				dPart = "õppimise aeg"; 
			} else {
				dPart = "vaba aeg";
			}
		}
	} else if (dayNameNow === "esmaspäev" || dayNameNow === "teisipäev" || dayNameNow === "kolmapäev" || dayNameNow === "neljapäev" || dayNameNow === "reede"){ 
	console.log("Täna on tööpäev: " + dayNameNow);
		if(dayNameNow === "esmaspäev"){
			if (hourNow < 8 ){
				dPart = "uneaeg";
			} else if (hourNow > 10 && hourNow <= 20){
				dPart = "kooliaeg";
			} else {
				dPart = "vaba aeg";
			}
		} else if (dayNameNow === "teisipäev") {
            if (hourNow < 8) {
                dPart = "uneaeg";
			} else if (hourNow > 10 && hourNow < 14){
				dPart = "kooliaeg";
			} else if (hourNow > 14 && hourNow < 16){
				dPart = "trenn";
			} else if (hourNow > 16 && hourNow <= 19){
				dPart = "õppimise aeg";
			} else {
				dPart = "vaba aeg";
			}
		} else if (dayNameNow === "kolmapäev"){
			if (hourNow > 8 && hourNow < 14){
				dPart = "kooliaeg";
			} else if (hourNow > 15 && hourNow < 18){
				dPart = "õppimise aeg";
			} else if (hourNow > 18 && hourNow < 20){
				dPart = "trenn";
			} else {
				dPart = "vaba aeg";
			}
		} else if (dayNameNow === "neljapäev"){
			if (hourNow > 10 && hourNow < 12){
				dPart = "kooliaeg"
			} else if (hourNow > 12 && hourNow < 18){
				dPart = "õppimiseaeg";
			} else {
				dPart = "vaba aeg";
			}
		} else if (dayNameNow === "reede"){
			if (hourNow > 10 && hourNow < 12){
				dPart = "trenn";
			} else if (hourNow > 13 && hourNow < 18){
				dPart = "õppimise aeg";
			} else {
				dPart = "vaba aeg";
			}
		}
	} else {
		dPart = "vaba aeg";
	}
	
	return dPart;
}

//ekspordin kõik vajaliku
module.exports = {dateFormatted: dateFormatted, dayFormatted: dayFormatted, timeFormatted: timeFormatted, dayNames: dayNamesEt, monthNames: monthNamesEt, dayPart: partOfDay};