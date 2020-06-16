/* eslint-disable no-await-in-loop */
const functions = require('firebase-functions');
const express = require('express');
const middlewares = require('./middlewares');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const cron = require("node-cron");
var app = express();
const firebase = require("firebase/app");
require("firebase/auth");
require("firebase/firestore");
const Scrape = require('./scrape')
const refreshScrape = require('./refreshScrape')
const db = firebase.firestore()
require('dotenv').config();

const firebaseConfig = {
    apiKey: process.env.APIKEY,
    authDomain: process.env.AUTHDOMAIN,
    projectId: process.env.PROJECTID
  }


if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
 }

const getData = async () =>  {
  const snapshot = await db.collection('urls').get()
  return snapshot.docs.map(doc => doc.data().url);
  }

const getEventData = async () =>  {
  const snapshot = await db.collection('virtualevents').get()
  return snapshot.docs.map(doc => doc.data().lookupProfileId)
  }

cron.schedule("* * * * *", async () => {
  try {
      await checkUrlData()
  } catch (err) {
      console.log('Error in New Scrape: '+err)

  }
  
});

cron.schedule("0 22 * * *", async () => {
  try {
      await refreshScrape.refreshEventData()
  } catch(err) {
    console.log('Error in refresh: '+err)
  }
  
});



app.use(morgan('common'));
app.use(helmet());
app.use(cors({
	//origin: envVariables.REACT_APP_CORS_ORIGIN
}));

const scrape = async (url,checkData) => {
  let output = await Scrape.master(url)
  let AllInput=[]
  if (output.length===0) {
    throw(Error)
  }
  for (i=0; i<output.length; i+=1) {

      try{
        output[i].eventAbout = output[i].description;
      } catch(err) {
        output[i].eventAbout = "none"
      }
      try{
        output[i].eventDate = output[i].startDate;
      } catch(err) {
        output[i].eventDate = "none"
      }
      try{
        output[i].eventEndDate = output[i].endDate;
      } catch(err) {
        output[i].eventEndDate = "none"
      }
      try{
        output[i].eventTitle = output[i].name;
      } catch(err) {
        output[i].eventTitle = "none"
      }
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
      // eslint-disable-next-line no-await-in-loop
      if (output[i].eventDate == null){
        console.log('Fix Null')
        output[i].eventDate='none'
      }
      let setDoc
      try{
        setDoc = await db.collection('virtualevents').add(output[i]);
      }
      catch (err) {
        if (err.stack.includes('eventAbout')) {
          output[i].eventAbout = "none"
          setDoc = await db.collection('virtualevents').add(output[i]);
        } else {
          output[i].eventEndDate = "none"
          setDoc = await db.collection('virtualevents').add(output[i]);
        }
      }
      AllInput.push(setDoc)
  }
}

const checkUrlData = async () => {
  const checkData =  await getData();
  const EventData =  await getEventData();
  for (let i=0; i<checkData.length; i+=1){
    if(EventData.includes(checkData[i])) {
        var done = 'done'
    } else {
      console.log('NEEDS ADDING')
      console.log(checkData[i])
      let kill=false
      Add_to_list=[]
      // eslint-disable-next-line no-await-in-loop
      const snapshot = await db.collection('urls').where('url','==',checkData[i]).get()
      // eslint-disable-next-line no-loop-func
      snapshot.docs.map(doc => {
          if (doc.data().Issue==="Error") {
            console.log('Already Ran see error status')
            kill=true
          } else {
            Add_to_list.push(doc.data().url)
          }
      });
      if (kill) {
        continue
      }
      // eslint-disable-next-line no-await-in-loop
      try {
          await scrape(Add_to_list[0],checkData[i])
    }  catch(err) {
        // eslint-disable-next-line no-await-in-loop
        console.log(err)
        // eslint-disable-next-line no-loop-func
        snapshot.docs.map(doc =>

        db.collection("urls").doc(doc.id).update({'Issue' : "Error"}))
    }
  }

  for (let i=0; i<EventData.length; i+=1){
    if(checkData.includes(EventData[i])) {
         done = 'done'
    } else {
      console.log('NEEDS REMOVING')
      // eslint-disable-next-line no-await-in-loop
      snapshot = await db.collection('virtualevents').where('lookupProfileId', '==', EventData[i]).get()
      snapshot.docs.map(doc => db.collection('virtualevents').doc(doc.id).delete()
      
      );
    }
  }
}
}


app.get('/', async (req,res) => {
    res.json(await getData())
});
app.use(express.json());
app.use(middlewares.notFound);
app.use(middlewares.errorHandler);


const port = process.env.REACT_APP_PORT || 5000;
// app.listen(port, () => {
// 	console.log(`Listening at http://localhost:${port}`);
// });

exports.app = functions.https.onRequest(app);

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
