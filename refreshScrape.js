/* eslint-disable promise/always-return */
/* eslint-disable no-loop-func */
const Scrape = require('./scrape')

require('dotenv').config();

const firebaseConfig = {
    apiKey: process.env.APIKEY,
    authDomain: process.env.AUTHDOMAIN,
    projectId: process.env.PROJECTID
  }
  
const firebase = require("firebase/app");

  // Add the Firebase products that you want to use
require("firebase/auth");
require("firebase/firestore");

firebase.initializeApp(firebaseConfig)
const db = firebase.firestore()
const functions = require('firebase-functions');


const refreshScrape = async (url,checkData) => {
    console.log(url)
    let output = await Scrape.master(url)
    let AllInput=[]
    for (i=0; i<output.length; i+=1) {
        output[i].eventAbout = output[i].description;
        output[i].eventDate = output[i].startDate;
        output[i].eventEndDate = output[i].endDate;
        output[i].eventTitle = output[i].name;
        try {
          output[i].eventLocation = output[i].location.name;
        } catch (err) {
          output[i].eventLocation = "none"
        }
        output[i].eventProfileId = "";
        output[i].lookupProfileId = checkData;
        output[i].eventUrl = output[i].url;
        output[i].eventZipCode = "none";
        output[i].recurringCycle = "none";
        output[i].tag = ""
        delete output[i].description;
        delete output[i].startDate;
        delete output[i].endDate;
        delete output[i].name;
        delete output[i].location;
        delete output[i].url;
        AllInput.push(output)
    }
    console.log(AllInput)
    return AllInput
  }

const getData = async () =>  {
  const snapshot = await db.collection('urls').get()
  return snapshot.docs.map(doc => doc.data().url);
  }

const getEventData = async () =>  {
  const snapshot = await db.collection('virtualevents').get()
  return {lookupProfileId: snapshot.docs.map(doc => doc.data().lookupProfileId),
    eventUrl: snapshot.docs.map(doc => doc.data().eventUrl),
    docid: snapshot.docs.map(doc => doc.id)
  }
  }


const refreshEventData = async () => {
    const EventData =  await getEventData();
    for (let i=0; i<EventData.lookupProfileId.length;i+=1) {
      // eslint-disable-next-line no-await-in-loop
      const scrapeResults = await refreshScrape(EventData.lookupProfileId[i],EventData.lookupProfileId[i])
      for (let j=0;j<scrapeResults.length;j+=1) {
          for (let k=0;k<scrapeResults[j].length;k+=1) {
            // eslint-disable-next-line promise/catch-or-return
            db.collection("virtualevents").where('eventUrl', "==", scrapeResults[j][k].eventUrl)
        .get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                //console.log(doc.id, " => ", doc.data());
                old_obj=doc.data()
                new_obj=scrapeResults[j][k]
                // Build doc ref from doc.id
                difference = Object.keys(old_obj).filter(l => old_obj[l] !== new_obj[l]);
                console.log(old_obj)
                console.log(new_obj)
               for (let ijk=0; ijk<difference.length; ijk+=1) {
                   console.log([difference[ijk]])
                db.collection("virtualevents").doc(doc.id).update({[difference[ijk]]: scrapeResults[j][k][difference[ijk]]});
               }
            });
        })
    }
      }
    }
  }



  module.exports = {
	
	refreshEventData,

};