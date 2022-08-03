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
    {/*fetchNotes();*/}
  }

  async function deleteNote({ id }) {
    {/*const deleteDetails = {
      id: id,
      _version: 1
    };
   await API.graphql({ query: deleteNoteMutation, variables: { input: deleteDetails }}); */}
   const noteToDelete = notes.find(note => note.id === id);
   console.log("Note to delete: ", noteToDelete.image);



   const newNotesArray = notes.filter(note => note.id !== id);
   setNotes(newNotesArray);
   await API.graphql({ query: deleteNoteMutation, variables: { input: { id } }});

   {/*if we change the image to make it visible, we can't delete it here*/}
   await Storage.remove(noteToDelete.image, { level: 'private' });
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
    console.log("Note to download: ", noteToDownload.image);

    const result = await Storage.get(noteToDownload.image, { download: true });
    downloadBlob(result.Body, noteToDownload.image);
  }

  async function onChange(e) {
    if (!e.target.files[0]) return
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    {/*await Storage.put(file.name, file);*/}
    console.log("Putting ", file.name);
    await Storage.put(file.name, file, {
      level: "private",
      contentType: "file",
    });
    fetchNotes();
  }

  return (
    <div className="App">
      <h1>Ancala Health</h1>
      <input
        onChange={e => setFormData({ ...formData, 'name': e.target.value})}
        placeholder="Name"
        value={formData.name}
      />
      <input
        onChange={e => setFormData({ ...formData, 'description': e.target.value})}
        placeholder="Description"
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
