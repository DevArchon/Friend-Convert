import React from 'react';
import Home from './components/home/Home';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import './Popup.css';
import Login from './components/Login/login';
import { useState, useEffect } from 'react';
import TargetFriends from './components/TargetFriends/targetFriends';
import FriendsImpression from './components/FriendsImpression/friendsImpression';

function Popup() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [page, setPage] = useState('login');

  console.log('Current page state:', page);

  useEffect(() => {
    chrome.storage.local.get('licenseKey', (result) => {
      if (result.licenseKey) {
        setIsLoggedIn(true);
        setPage('friendsImpression'); // Set default page to 'home' after login
      }
    });
  }, []);
  return (
    <>
      <div className="popup-container">
        {page === 'home' ||
        page === 'targetFriends' ||
        page === 'friendsImpression' ? (
          <>
            <Header
              page={page}
              setPage={setPage}
              isLoggedIn={isLoggedIn}
              setIsLoggedIn={setIsLoggedIn}
            />
            {page === 'home' ? (
              <Home page={page} setPage={setPage} />
            ) : page === 'targetFriends' ? (
              <TargetFriends />
            ) : page === 'friendsImpression' ? (
              <FriendsImpression />
            ) : null}
            <Footer />
          </>
        ) : page === 'login' || isLoggedIn === false ? (
          <Login
            isLoggedIn={isLoggedIn}
            setIsLoggedIn={setIsLoggedIn}
            page={page}
            setPage={setPage}
          />
        ) : null}
      </div>
    </>
  );
}

export default Popup;
