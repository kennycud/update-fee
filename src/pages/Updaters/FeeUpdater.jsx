import {List, ListItem, ListItemText, Menu, MenuItem} from "@mui/material";
import React, {useCallback, useEffect, useRef} from "react";
import {useSelector} from "react-redux";
import {utf8ToBase64} from "./Utf8ToBase64.jsx";

const coins = ['BTC', 'LTC', 'DOGE', 'DGB', 'RVN', 'ARRR' ];
const types = ['LOCKING', 'UNLOCKING'];

export const FeeUpdater = () => {

    const coin = useRef();
    const type = useRef();

    const [editFee, setEditFee] = React.useState([]);
    const [savedFee, setSavedFee] = React.useState([]);
    const [fetch, setFetch] = React.useState([]);
    const [anotherName, setAnotherName] = React.useState([]);
    const [anotherFetch, setAnotherFetch] = React.useState([]);
    const registeredName = useSelector((state) => state.auth?.user?.name);
    const [unit, setUnit] = React.useState([]);
    const LOCKING_UNIT = 'sat/kb';
    const UNLOCKING_UNIT = 'total sats';

    const SAVED_FEE_DESCRIPTION = 'The saved fee is saved to the core server. If the core server restarts, the saved fee is reset to the default value.';
    const BUYER_LOCKING_FEE_DESCRIPTION = 'The QORT buyer uses the saved locking fee when broadcasting their foreign coin transaction to a foreign blockchain for the QORT seller to see. This fee is multiplied by the size (in KB) of the transaction.';
    const BUYER_UNLOCKING_FEE_DESCRIPTION = 'The QORT buyer uses the saved unlocking fee when broadcasting their foreign coin transaction to complete the trade. This is set for the total transaction size (total sats). The total transaction size is approximately 300 KB.';
    const SELLER_FEE_DESCRIPTION = "The QORT seller does not use the saved locking fee. The QORT seller uses the saved unlocking fee when accepting or rejecting the Qort buyer's unlocking transaction.";
    const PUBLISH_FEE_DESCRIPTION_1 = 'A user can publish their fees to QDN.'
    const PUBLISH_FEE_DESCRIPTION_2 = 'If a user publishes their fees, they can always retrieve them after their core server restarts by using the match button.'
    const SELLER_PUBLISH_FEE_DESCRIPTION = 'The QORT seller can publish their fees to communicate to QORT buyers what fees they are accepting and rejecting.'
    const BUYER_PUBLISH_FEE_DESCRIPTION = "The QORT buyer can match the seller's required fees by typing in their name, fetching their fee requirement and using the match button."

    /**
     * Establish Update Fee Form
     *
     * @type {(function(): Promise<void>)|*}
     */
    const establishUpdateFeeForm = useCallback(async () => {

        // clear out the fetch values
        setFetch('');

        // if the coin or type is not set, then abort
        if( typeof coin.current === 'undefined' || typeof type.current === 'undefined') {
            setFees('');
            return;
        }

        const coinRequest = coin.current.toLowerCase();
        const typeRequest = (type.current == 'LOCKING') ? 'feekb' : 'feeceiling';

        try {
            const response = await qortalRequestWithTimeout({
                action: 'GET_FOREIGN_FEE',
                coin: coinRequest,
                type: typeRequest
            }, 1800000)

            setFees( response );
        } catch (error) {
            setFees('');
            console.error(error)
        }
    }, [])

    const displayFetchData = useCallback( async() => {
        // if the coin or type is not set, then abort
        if( typeof coin.current === 'undefined' || typeof type.current === 'undefined') {
            setFetch('');
            return;
        }
        try {
            const response = await qortalRequestWithTimeout({
                action: "FETCH_QDN_RESOURCE",
                name: registeredName,
                service: "ARBITRARY_DATA",
                identifier: getIdentifier()
            }, 1800000);

            setFetch(response);
        } catch (error) {
            console.error(error)
            setFetch('');
        }
    }, [registeredName])

    const clearAnotherFetch = useCallback( async() => {
        setAnotherName('');
        setAnotherFetch('');
    }, []);

    useEffect(() => {

        console.log('editFee or fetch changed');
    }, [editFee,fetch]);

    const [anchorCoinEl, setAnchorCoinEl] = React.useState(null);
    const [selectedCoinIndex, setSelectedCoinIndex] = React.useState();
    const coinOpen = Boolean(anchorCoinEl);

    const handleClickListCoin = (event) => {
        setAnchorCoinEl(event.currentTarget);
    };

    const handleMenuCoinClick = (event, index) => {
        setSelectedCoinIndex(index);
        setAnchorCoinEl(null);

        coin.current = coins[index];
        establishUpdateFeeForm();
        displayFetchData();
        clearAnotherFetch();
    };

    const handleCoinClose = () => {
        setAnchorCoinEl(null);
    };

    const [anchorTypeEl, setAnchorTypeEl] = React.useState(null);
    const [selectedTypeIndex, setSelectedTypeIndex] = React.useState();
    const typeOpen = Boolean(anchorTypeEl);

    const handleClickListType = (event) => {
        setAnchorTypeEl(event.currentTarget);
    };

    const handleMenuTypeClick = (event, index) => {
        setSelectedTypeIndex(index);
        setAnchorTypeEl(null);

        type.current = types[index];
        type.current === 'LOCKING' ? setUnit(LOCKING_UNIT ) : setUnit(UNLOCKING_UNIT);

        establishUpdateFeeForm();
        displayFetchData();
        clearAnotherFetch();
    };

    const handleTypeClose = () => {
        setAnchorTypeEl(null);
    };

    const saveFormData = async() => {

        if( typeof coin.current === 'undefined' || typeof type.current === 'undefined' || typeof editFee === 'undefined') {
            return;
        }

        const coinRequest = coin.current.toLowerCase();
        const typeRequest = (type.current == 'LOCKING') ? 'feekb' : 'feeceiling';

        try {
            const response = await qortalRequestWithTimeout({
                action: 'UPDATE_FOREIGN_FEE',
                coin: coinRequest,
                type: typeRequest,
                value: editFee
            }, 1800000)

            setFees( response );
        } catch (error) {
            establishUpdateFeeForm();
            console.error(error)
        }
    }
    const onSubmit = async(event) => {
        event.preventDefault();

        saveFormData();
    }

    function getIdentifier() {
        return coin.current + '-' + type.current;
    }

    const publishFormData  = async() => {

        let base64 = utf8ToBase64(editFee);
        try {
            await qortalRequest({
                action: "PUBLISH_QDN_RESOURCE",
                name: registeredName,
                service: "ARBITRARY_DATA",
                data64: base64,
                identifier: getIdentifier()
            });

            displayFetchData();
        } catch (error) {
            console.error(error)
        }
    }

    const onPublish = async(event) => {
        event.preventDefault();

        publishFormData();
    }

    const displayNameData = async() => {
        // if the coin or type is not set, then abort
        if( anotherName === '' || typeof coin.current === 'undefined' || typeof type.current === 'undefined') {
            setAnotherFetch('');
            return;
        }

        try {
            const response = await qortalRequestWithTimeout({
                action: "FETCH_QDN_RESOURCE",
                name: anotherName,
                service: "ARBITRARY_DATA",
                identifier: getIdentifier()
            }, 1800000);

            setAnotherFetch(response);
        } catch (error) {
            console.error(error)
            setAnotherFetch('');
        }
    }

    const onAnotherName = async(event) => {
        event.preventDefault();

        displayNameData();
    }

    const onMatchMine = async(event) => {
        event.preventDefault();

        setEditFee(fetch);
    }

    const onMatchOther = async(event) => {
        event.preventDefault();

        setEditFee(anotherFetch)
    }

    function setFees(value) {
        setEditFee(value);
        setSavedFee(value)
    }

    return (
        <div className="grid-container">
            <div>
                <List
                    component="nav"
                    aria-label="Coins"
                    sx={{bgcolor: "background.paper"}}
                >
                    <ListItem
                        button
                        id="lock-button"
                        aria-haspopup="listbox"
                        aria-controls="lock-menu"
                        aria-label="derived addresses"
                        aria-expanded={coinOpen ? "true" : undefined}
                        onClick={handleClickListCoin}
                    >
                        <ListItemText
                            primary="Select Coin"
                            secondary={coins[selectedCoinIndex]}
                        />
                    </ListItem>
                </List>
                <Menu
                    id="lock-menu"
                    anchorEl={anchorCoinEl}
                    open={coinOpen}
                    onClose={handleCoinClose}
                    MenuListProps={{
                        'aria-labelledby': 'lock-button',
                        role: 'listbox'
                    }}
                >
                    {coins.map((coin, index) => (
                        <MenuItem
                            key={coin}
                            disabled={index === selectedCoinIndex}
                            selected={index === selectedCoinIndex}
                            onClick={(event) => handleMenuCoinClick(event, index)}
                        >
                            {coin}
                        </MenuItem>
                    ))}
                </Menu>

                <List
                    component="nav"
                    aria-label="Types"
                    sx={{bgcolor: "background.paper"}}
                >
                    <ListItem
                        button
                        id="lock-button"
                        aria-haspopup="listbox"
                        aria-controls="lock-menu"
                        aria-label="derived addresses"
                        aria-expanded={typeOpen ? "true" : undefined}
                        onClick={handleClickListType}
                    >
                        <ListItemText
                            primary="Select Type"
                            secondary={types[selectedTypeIndex]}
                        />
                    </ListItem>
                </List>
                <Menu
                    id="lock-menu"
                    anchorEl={anchorTypeEl}
                    open={typeOpen}
                    onClose={handleTypeClose}
                    MenuListProps={{
                        'aria-labelledby': 'lock-button',
                        role: 'listbox'
                    }}
                >
                    {types.map((type, index) => (
                        <MenuItem
                            key={type}
                            disabled={index === selectedTypeIndex}
                            selected={index === selectedTypeIndex}
                            onClick={(event) => handleMenuTypeClick(event, index)}
                        >
                            {type}
                        </MenuItem>
                    ))}
                </Menu>
            </div>
            <div>
                <form onSubmit={onSubmit}>
                    <div>
                        <label>Fee: {savedFee} {unit}</label>
                    </div>
                    <div>
                        <label htmlFor="fee">Edit: </label>
                        <input type="text"
                               id="fee"
                               value={editFee}
                               disabled={typeof coin.current === 'undefined' || typeof type.current === 'undefined'}
                               onChange={(e) => setEditFee(e.target.value)}
                        />
                        <label> {unit}</label>
                    </div>
                    <div>
                        <button type="submit">Save</button>
                    </div>
                </form>
                <form onSubmit={onPublish}>
                    <div>
                        <button type="submit">Publish</button>
                    </div>
                </form>
            </div>
            <div>
                <div>
                    <label>{SAVED_FEE_DESCRIPTION}</label>
                </div>
                <div>
                    <label>{BUYER_LOCKING_FEE_DESCRIPTION}</label>
                </div>
                <div>
                    <label>{BUYER_UNLOCKING_FEE_DESCRIPTION}</label>
                </div>
                <div>
                    <label>{SELLER_FEE_DESCRIPTION}</label>
                </div>
            </div>
            <div>
                <div>
                    <label>{registeredName}</label>
                </div>
                <div>
                    <label>{fetch} {unit}</label>
                </div>
                <form onSubmit={onMatchMine}>
                    <div>
                        <button type="submit">Match</button>
                    </div>
                </form>
            </div>

            <div>
                <form onSubmit={onAnotherName}>
                    <div>
                        <label htmlFor="anotherName">Name</label>
                        <input type="text"
                               id="anotherName"
                               value={anotherName}
                               onChange={(e) => setAnotherName(e.target.value)}
                        />
                    </div>
                    <div>
                        <button type="submit">Fetch Fee Requirement</button>
                    </div>
                    <div>
                        <label>{anotherFetch} {unit}</label>
                    </div>
                </form>
                <form onSubmit={onMatchOther}>
                    <div>
                     <button type="submit">Match</button>
                    </div>
                </form>
            </div>
            <div>
                <div>
                    <label>{PUBLISH_FEE_DESCRIPTION_1}</label>
                </div>
                <div>
                    <label>{PUBLISH_FEE_DESCRIPTION_2}</label>
                </div>
                <div>
                    <label>{SELLER_PUBLISH_FEE_DESCRIPTION}</label>
                </div>
                <div>
                    <label>{BUYER_PUBLISH_FEE_DESCRIPTION}</label>
                </div>
            </div>
        </div>
    );
}
