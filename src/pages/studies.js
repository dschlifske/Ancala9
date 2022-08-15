import React from 'react';
import ReactDOM from 'react-dom/client';
import { useState } from "react";
import { Divider } from "@aws-amplify/ui-react";
import '../App.css';
import "@aws-amplify/ui-react/styles.css";
import { useEffect } from 'react';
import { API } from 'aws-amplify';
import { Auth } from 'aws-amplify';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import { listNotes } from '../graphql/queries';
import { createNote as createNoteMutation, deleteNote as deleteNoteMutation } from '../graphql/mutations';
import { Storage } from 'aws-amplify';
import "../styles.css"
import { MarketingFooter} from "../ui-components";
import { Router, BrowserRouter, Routes, Route, useNavigate, Link, Navigate, NavLink } from "react-router-dom";
import { Menu, MenuItem, View } from '@aws-amplify/ui-react';
import Home from '../pages';
import NavBar from '../NavBar/NavBar'
import { CgMenuRound } from 'react-icons/cg'
import classes from './studies.module.css'

const Studies = (user) => {
 
      const [notes, setNotes] = useState([]);
    
      useEffect(() => {
        fetchNotes();
      }, []);
   
      async function fetchNotes() {
        const apiData = await API.graphql({ query: listNotes });
        const notesFromAPI = apiData.data.listNotes.items;
        await Promise.all(notesFromAPI.map(async note => {
          return note;
        }))
        setNotes(apiData.data.listNotes.items);
      }
    
      async function deleteNote({ id }) {
       const noteToDelete = notes.find(note => note.id === id);
    
       const newNotesArray = notes.filter(note => note.id !== id);
       setNotes(newNotesArray);
       console.log("Removing record from graphql");
       await API.graphql({ query: deleteNoteMutation, variables: { input: { id } }});
    
       console.log("Removing files from s3");

       for (var i = 0; i < noteToDelete.image.length; i++) {
        console.log("Removing ", noteToDelete.image[i], " from s3");
        await Storage.remove(noteToDelete.image[i], { level: 'private' });
       }
      }
    
      async function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'download';
        const clickHandler = () => {
          setTimeout(() => {
            URL.revokeObjectURL(url);
            a.removeEventListener('click', clickHandler);
          }, 150);
        };
        a.addEventListener('click', clickHandler, false);
        a.click();
        return a;
      }
    
      async function downloadNote({ id }) {
        const noteToDownload = notes.find(note => note.id === id);
        console.log("Note to download: ", noteToDownload);
        console.log("Image to dowload: ", noteToDownload.image[0]);
    
        const result = await Storage.get(noteToDownload.image[0], { download: true });
        downloadBlob(result.Body, noteToDownload.image[0]);
      }

      async function uploadFiles(e) {
        if (!e.target.files[0]) return  

        console.log("Files: ", e.target.files);
        console.log("Number of files: ", e.target.files.length);

        var myFormObject = { name: '', description: '', image: '' };

        let fileArray = [];
        for (var i = 0; i < e.target.files.length; i++) {
          console.log("adding ", e.target.files[i].name, " to array");
          fileArray.push(e.target.files[i].webkitRelativePath);
        }
        console.log("Array: ", fileArray);
        myFormObject.image = fileArray;

        // This code takes the file and turns it into a blob ("fileb") so we can use dicomParser
        const get_file_array = (file) => {
          return new Promise((acc, err) => {
              const reader = new FileReader();
              reader.onload = (event) => { acc(event.target.result) };
              reader.onerror = (err)  => { err(err) };
              reader.readAsArrayBuffer(file);
          });
        }
        const temp = await get_file_array(e.target.files[0])
        const fileb = new Uint8Array(temp)

        // Use dicom parser on the blob
        try {
          var dicom = require('dicom-parser');
          var dataSet = dicom.parseDicom(fileb);
          var studyInstanceUid = dataSet.string('x0020000d');
          var patientName = dataSet.string('x00100010');
          var studyDescription = dataSet.string('x00081030');
          console.log(studyInstanceUid);
        } catch (e) {
          console.log("Caught error parsing file with dicom parser");
          alert('Hmmm... this does not seem to be a folder with valid DICOM images.');
          document.getElementById('fileInput').value = '';
          return;
        }    
        myFormObject.name = patientName;
        myFormObject.description = studyDescription;

        for (var i = 0; i < e.target.files.length; i++) {
          console.log("Writing ", e.target.files[i].webkitRelativePath, " to S3");
          await Storage.put(e.target.files[i].webkitRelativePath, e.target.files[i], {
            level: "private",
            contentType: "file",
         });
        }
        
        console.log('creating new graphql element...');
        await API.graphql({ query: createNoteMutation, variables: { input: myFormObject } });
        console.log('done.');

        document.getElementById('fileInput').value = '';
        fetchNotes();
      }
    
      return (
          <div className={classes.studies}>
          <div>
            <h1>Upload Images</h1>
            <p>Select the folder called "DICOM"</p>
            <input type="file" directory="" webkitdirectory="" onChange={uploadFiles} id="fileInput" />
          </div>
          <p/>
          <Divider />
          <p/>
          <h1>My Images</h1>
          <div style={{marginBottom: 30}}>
            {
              notes.map(note => (
              <div key={note.id || note.name}>
              <h2>{note.name}</h2>
              <p>{note.description}</p>
              <button onClick={() => deleteNote(note)}>Delete</button>
              {
                note.image && <img src={note.image} style={{width: 400}} />
              }
              <button onClick={() => downloadNote(note)}>Download</button>
              </div>
            ))
            }
          </div>
        </div>
      );
}

export default Studies;
