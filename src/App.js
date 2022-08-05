import React, { useState, useEffect } from 'react';
import './App.css';
import { API } from 'aws-amplify';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import { listNotes } from './graphql/queries';
import { createNote as createNoteMutation, deleteNote as deleteNoteMutation } from './graphql/mutations';
import { Storage } from 'aws-amplify';
import { Header } from "./Header";
import { Footer } from "./Footer";
import { SignInHeader } from "./SignInHeader";
import { SignInFooter } from "./SignInFooter";
import "./styles.css"

const initialFormState = { name: '', description: '' }

function App({ isPassedToWithAuthenticator, signOut, user }) {
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
    <div className="App">
      <h1>Upload a DICOM Image series</h1>
      <input
        onChange={e => setFormData({ ...formData, 'name': e.target.value})}
        placeholder="Name (required)"
        value={formData.name}
      />
      <p/>
      <input
        onChange={e => setFormData({ ...formData, 'description': e.target.value})}
        placeholder="Description (optional)"
        value={formData.description}
      />
      {/*<input
        type="file"
        onChange={onChange}
       />*/}
      <label>
        <p/>
        Select DICOM image directory
        <p/>
        <input type="file" directory="" webkitdirectory="" onChange={onChange} />
      </label>
      <p/>
      <button onClick={createNote}>Upload Image Series</button>
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
      <button onClick={signOut}>Sign out</button>
    </div>
  );
}

//export default withAuthenticator(App);
export default withAuthenticator(App, {
  components: {
    Header,
    SignIn: {
      Header: SignInHeader,
      Footer: SignInFooter
    },
    Footer
  }
});
