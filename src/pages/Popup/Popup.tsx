import React from 'react';
import Home from './components/home/Home';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import './Popup.css';
import Login from './components/Login/login';
import { useState, useEffect } from 'react';
import TargetFriends from './components/TargetFriends/targetFriends';
import CancelPending from './components/cancelPendingRequest/cancelPending';
import FriendsImpressions from './components/FriendsImpression/friendsImpression';

function Popup() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [page, setPage] = useState('login');

  useEffect(() => {
    chrome.storage.local.get('licenseKey', (result) => {
      if (result.licenseKey) {
        setIsLoggedIn(true);
        setPage('home');
      }
    });
  }, []);
  return (
    <>
      <div className="popup-container">
        {page === 'home' ||
        page === 'targetFriends' ||
        page === 'cancelPending' ||
        page === 'friendsImpressions' ? (
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
            ) : page === 'cancelPending' ? (
              <CancelPending />
            ) : page === 'friendsImpressions' ? (
              <FriendsImpressions />
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
