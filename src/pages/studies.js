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


const Studies = (user) => {
 
    const initialFormState = { name: '', description: '' }

      const [notes, setNotes] = useState([]);
      const [formData, setFormData] = useState(initialFormState);
    
      useEffect(() => {
        fetchNotes();
      }, []);

   
      async function fetchNotes() {
        const apiData = await API.graphql({ query: listNotes });
        const notesFromAPI = apiData.data.listNotes.items;
        await Promise.all(notesFromAPI.map(async note => {
          if (note.image) {
            Storage.configure({ level: 'private' });
            const image = await Storage.get(note.image);
            {/*change the image to make it visible -- shouldnt matter for dicom images anyway*/}
            {/*note.image = image;*/}
          }
          return note;
        }))
        setNotes(apiData.data.listNotes.items);
      }
    
      async function createNote() {
        if (!formData.name || !formData.description) return;
        console.log(formData.image);
        await API.graphql({ query: createNoteMutation, variables: { input: formData } });
        if (formData.image) {
          Storage.configure({ level: 'private' });
          const image = await Storage.get(formData.image);
          console.log("before: ", formData.image);
          {/*change the image to make it visible -- shouldnt matter for dicom images anyway*/}
          {/*formData.image = image;*/}
          console.log("after: ", formData.image);
        }
        setNotes([ ...notes, formData ]);
        setFormData(initialFormState);
        console.log(notes);
        fetchNotes(); // I think this is needed to refresh the graphql records(?)
      }
    
      async function deleteNote({ id }) {
        {/*const deleteDetails = {
          id: id,
          _version: 1
        };
       await API.graphql({ query: deleteNoteMutation, variables: { input: deleteDetails }}); */}
       const noteToDelete = notes.find(note => note.id === id);
       console.log("Number of note(s) to delete: ", noteToDelete.image.length);
       console.log("Note(s) to delete: ", noteToDelete.image);
    
    
    
       const newNotesArray = notes.filter(note => note.id !== id);
       setNotes(newNotesArray);
       console.log("Removing record from graphql");
       await API.graphql({ query: deleteNoteMutation, variables: { input: { id } }});
    
       console.log("Removing file from s3");
       //{/*if we change the image to make it visible, we can't delete it here*/}
       //await Storage.remove(noteToDelete.image[0], { level: 'private' });
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

  
      async function onChange(e) {
        if (!e.target.files[0]) return  
        //const file = e.target.files[0];
        console.log("Files: ", e.target.files);
        console.log("Number of files: ", e.target.files.length);
        //const fileArray = [ e.target.files[0], e.target.files[1] ];
        let fileArray = [];
        for (var i = 0; i < e.target.files.length; i++) {
          console.log("adding ", e.target.files[i].name, " to array");
          fileArray.push(e.target.files[i].webkitRelativePath);
        }
        console.log("Array: ", fileArray);
        setFormData({ ...formData, image: fileArray });

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
        //console.log('here we finally ve the file as a ArrayBuffer : ',temp);
        const fileb = new Uint8Array(temp)

        // Use dicom parser on the blob
        try {
          var dicom = require('dicom-parser');
          var dataSet = dicom.parseDicom(fileb);
          var studyInstanceUid = dataSet.string('x0020000d');
          console.log(studyInstanceUid);
        } catch (e) {
          console.log("Caught error parsing file with dicom parser");
          alert('Hmmm... this does not seem to be a folder with valid DICOM images.');
          document.getElementById('fileInput').value = '';
          return;
        }    

        {/*await Storage.put(file.name, file);*/}
        //console.log("Putting ", file.name);
        // await Storage.put(file.name, file, {
        //   level: "private",
        //   contentType: "file",
        // });
        for (var i = 0; i < e.target.files.length; i++) {
          console.log("Writing ", e.target.files[i].webkitRelativePath, " to S3");
          await Storage.put(e.target.files[i].webkitRelativePath, e.target.files[i], {
            level: "private",
            contentType: "file",
         });
        }
    
        fetchNotes();
      }
    
      return (
          <div className="App-header">
          <p/>
          <p/>
          <h1>My Imaging Studies</h1>
          Get a pre-paid envelope for my CD/DVD
          <p/>
          <input
            onChange={e => setFormData({ ...formData, 'name': e.target.value})}
            placeholder="Name (required)"
            value={formData.name}
            id="nameInput"
          />
          <p/>
          <input
            onChange={e => setFormData({ ...formData, 'description': e.target.value})}
            placeholder="Description (optional)"
            value={formData.description}
            id="descriptionInput"
          />
          <p/>
          <button onClick={createNote}>Request Envelope</button>
          <p/>
          <Divider />
          {/*<input
            type="file"
            onChange={onChange}
           />*/}
          <label>
            <p/>
            Upload directly from your computer
            <p/>
            <input type="file" directory="" webkitdirectory="" onChange={onChange} id="fileInput"/>
          </label>
          {/*
          //Don't use the buttom anymore to upload from a directory
          <p/>
          <button onClick={createNote}>Upload Image Series</button>
          <p/> */}
          <p/>
          <Divider />
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
