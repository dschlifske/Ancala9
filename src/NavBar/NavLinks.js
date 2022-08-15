import React from 'react';
import { Router, BrowserRouter, Routes, Route, useNavigate, Link, Navigate, NavLink } from "react-router-dom";
import '../App.css';
import "@aws-amplify/ui-react/styles.css";
import { Auth } from 'aws-amplify';
import classes from './NavBar.module.css';
import { withAuthenticator } from "@aws-amplify/ui-react";

const NavLinks = (props) => {
       
    return (
        <ul>
            <li onClick={() => props.isMobile && props.closeMobileMenu()}>
                <Link to="/">Home</Link>
            </li>
            <li onClick={() => props.isMobile && props.closeMobileMenu()}>
                <Link to="/studies">Studies</Link>
            </li>
            <li>
                <Link to="." onClick={props.mySignOutFunction}>Sign Out</Link>
            </li>
        </ul>
    );
}

export default withAuthenticator(NavLinks);
