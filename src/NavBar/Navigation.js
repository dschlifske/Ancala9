import React from 'react';
import { Router, BrowserRouter, Routes, Route, useNavigate, Link, Navigate, NavLink } from "react-router-dom";
import '../App.css';
import "@aws-amplify/ui-react/styles.css";
import { Auth } from 'aws-amplify';
import classes from './NavBar.module.css';
import NavLinks from './NavLinks';
import { withAuthenticator } from "@aws-amplify/ui-react";


const Navigation = ({signOut}) => {
    return ( 
        <nav className={classes.Navigation}>
            <NavLinks mySignOutFunction={signOut}/>
        </nav>
    );
}

export default withAuthenticator(Navigation);