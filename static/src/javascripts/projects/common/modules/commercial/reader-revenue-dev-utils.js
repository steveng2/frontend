// @flow

import { removeCookie } from 'lib/cookies';
import { isUserLoggedIn } from 'common/modules/identity/api';
import { readerRevenueRelevantCookies } from 'common/modules/commercial/user-features';
import { clearViewLog as clearEpicViewLog } from 'common/modules/commercial/acquisitions-view-log';
import { clearParticipations } from 'common/modules/experiments/utils';
import {
    clearBannerHistory,
    minArticlesBeforeShowingBanner,
} from 'common/modules/commercial/membership-engagement-banner';
import { local } from 'lib/storage';
import {
    initMvtCookie,
    decrementMvtCookie,
    incrementMvtCookie,
} from 'common/modules/analytics/mvt-cookie';
import { setGeolocation } from 'lib/geolocation';

const clearCommonReaderRevenueStateAndReload = () => {
    readerRevenueRelevantCookies.forEach(cookie => removeCookie(cookie));

    initMvtCookie();
    clearParticipations();

    // Always clear out the epic view log, since otherwise this
    // reload might mean the epic no longer appears on the next page view
    clearEpicViewLog();

    if (isUserLoggedIn()) {
        if (window.location.origin.includes('localhost')) {
            // Assume they don't have identity running locally
            // So try and remove the identity cookie manually
            removeCookie('GU_U');
        } else {
            const profileUrl = window.location.origin.replace(
                /(www\.|m\.)/,
                'profile'
            );
            window.location.assign(`${profileUrl}/signout`);
        }
    } else {
        window.location.reload();
    }
};

const showMeTheEpic = () => {
    // Clearing out the epic view log happens before all reloads
    clearCommonReaderRevenueStateAndReload();
};

const showMeTheBanner = () => {
    clearBannerHistory();
    local.set('gu.alreadyVisited', minArticlesBeforeShowingBanner + 1);
    clearCommonReaderRevenueStateAndReload();
};

// For the below functions, assume the user can currently see the thing
// they want to display. So we don't clear out the banner history since
// we don't necessarily want the banner popping up if someone's working
// with the epic.
const showNextVariant = () => {
    incrementMvtCookie();
    clearCommonReaderRevenueStateAndReload();
};

const showPreviousVariant = () => {
    decrementMvtCookie();
    clearCommonReaderRevenueStateAndReload();
};

const changeGeolocation = () => {
    const geo = window.prompt('Enter two-letter geolocation code:');
    setGeolocation(geo);
    clearCommonReaderRevenueStateAndReload();
};

export const init = () => {
    // Expose functions so they can be called on the console and within bookmarklets
    window.guardian.readerRevenue = {
        showMeTheEpic,
        showMeTheBanner,
        showNextVariant,
        showPreviousVariant,
        changeGeolocation,
    };
};