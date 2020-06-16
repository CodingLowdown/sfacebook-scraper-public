const firebase = require("firebase/app");
require("firebase/auth");
require("firebase/firestore");
require('dotenv').config();
var FieldValue = require('firebase-admin').firestore.FieldValue;
const firebaseConfig = {
    apiKey: process.env.APIKEY,
    authDomain: process.env.AUTHDOMAIN,
    projectId: process.env.PROJECTID
  }


if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
 }

 const db = firebase.firestore()

 async function master() {
    const snapshot = await db.collection('urls').get()
    return snapshot.docs.map(doc => {
        if (doc.data().Issue) {
            db.collection('urls').doc(doc.id).update({
                Issue: "None"
            })
        } else {
            console.log('no delete')
        }
    }
       
        
    )
 }

 master()