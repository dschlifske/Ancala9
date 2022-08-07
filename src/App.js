import React from 'react';
import {HeroLayout1, SampleNavBar, StudyComponentCollection, AddImageSeries, MarketingFooter} from "./ui-components";
import { Router, BrowserRouter, Routes, Route, useNavigate, Link, Navigate, NavLink } from "react-router-dom";
import { DataStore } from "@aws-amplify/datastore";
import { withAuthenticator, signOut, Divider } from "@aws-amplify/ui-react";
import { Study } from "./models";
import './App.css';
import { useState, Heading, Button } from "react";
import { Menu, MenuItem, View } from '@aws-amplify/ui-react';
import Home from './pages/index.js';
import Studies from './pages/studies.js'
import NavBar from './NavBar/NavBar'
import { CgMenuRound } from 'react-icons/cg'
import Amplify from 'aws-amplify';
import { Header } from "./Header";
import { Footer } from "./Footer";
import { SignInHeader } from "./SignInHeader";
import { SignInFooter } from "./SignInFooter";
import awsExports from './aws-exports';
Amplify.configure(awsExports);



function App({ isPassedToWithAuthenticator, signOut, user }) {

  return (
    <div className="App">
      {/*<SampleNavBar overrides={samplenavbarOverrides} width="100%" />*/}

      <BrowserRouter>
        <NavBar signOut/>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/studies" element={<Studies user/>} />
        </Routes>

      </BrowserRouter>
      
      {/*<button onClick={signOut}>Sign out</button>*/}
      <MarketingFooter />
    </div>
  );

}

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
