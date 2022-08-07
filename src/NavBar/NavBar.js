import React from 'react';
import { Router, BrowserRouter, Routes, Route, useNavigate, Link, Navigate, NavLink } from "react-router-dom";
import '../App.css';
import "@aws-amplify/ui-react/styles.css";
import { Auth } from 'aws-amplify';
import classes from './NavBar.module.css'
import NavLinks from './NavLinks';
import Navigation from './Navigation';
import MobileNavigation from './MobileNavigation';
import { withAuthenticator, Divider } from "@aws-amplify/ui-react";


const NavBar = ({signOut}) => {
 
    return (
        <div className={classes.NavBar}>
            <Navigation signOut/>
            <MobileNavigation signOut/>
        </div>
    );
}

export default withAuthenticator(NavBar);