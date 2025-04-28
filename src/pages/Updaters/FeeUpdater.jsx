import {List, ListItem, ListItemText, Menu, MenuItem} from "@mui/material";
import React, {useCallback, useEffect, useRef, useState} from "react";

const coins = ['BTC', 'LTC', 'DOGE', 'DGB', 'RVN', 'ARRR' ];
const types = ['LOCKING', 'UNLOCKING'];

export const FeeUpdater = () => {

    const coin = useRef();
    const type = useRef();

    const [editFee, setEditFee] = React.useState([]);
    const [savedFee, setSavedFee] = React.useState([]);
    const [unit, setUnit] = React.useState([]);
    const LOCKING_UNIT = 'sat/kb';
    const UNLOCKING_UNIT = 'total sats';

    const socketRef = useRef(null);

    // for the sign button
    const [isButtonEnabled, setIsButtonEnabled] = useState(true);

    /**
     * Init Sign Button Status
     *
     * If there are unsigned fees for the user's account address, then the sign button should be enabled,
     * otherwise the button should be disabled.
     *
     * @returns {Promise<void>}
     */
    async function initSignButtonStatus() {

        let account = await qortalRequest({
            action: "GET_USER_ACCOUNT"
        });

        // fetch the unsigned fees for the user's account address
        const response = await fetch("/crosschain/unsignedfees/" + account.address);
        const unsignedFees = await response.json();

        // if there are unsigned fees to sign, then enable button
        if(unsignedFees.length > 0) {
            setIsButtonEnabled(true);
        }
        // if there are not unsigned fees to sign, the disable button
        else {
            setIsButtonEnabled(false);
        }
    }

    initSignButtonStatus();

    /**
     * Initialize Unsigned Fees Socket
     *
     * This will receive an empty object for every new unsigned fee added to the node.
     */
    function initSocket() {
        let socketTimeout;
        let socketLink = `${
            window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        }//${window.location.host}/websockets/crosschain/unsignedfees`;

        socketRef.current = new WebSocket(socketLink);
        socketRef.current.onopen = () => {
            setTimeout(pingSocket, 50);
        }

        socketRef.current.onmessage = (event) => {

            const data = JSON.parse(event.data);

            async function updateSignButtonStatus() {
                try {
                    let account = await qortalRequest({
                        action: "GET_USER_ACCOUNT"
                    });

                    if (account.address === data.address) {

                        if (data.positive) {
                            setIsButtonEnabled(true);
                        } else {
                            setIsButtonEnabled(false);
                        }
                    }
                } catch(e) {
                    console.log("Error: " + e);
                }
            }

            updateSignButtonStatus();
        }
        socketRef.current.onclose = () => {
            console.log('close');
        }
        socketRef.current.onerror = () => {
            clearTimeout(socketTimeout);
        }
        const pingSocket = () => {
            socketRef.current.send("ping");
            socketTimeout = setTimeout(pingSocket, 295000);
        }
    }

    /**
     * Use this to initialize the unsigned fees socket.
     */
    useEffect(() => {
        initSocket();

        return () => {
            if( socketRef.current) {
                socketRef.current.close(1000, "forced");
            }
        };
    }, []);

    /**
     * Establish Update Fee Form
     *
     * @type {(function(): Promise<void>)|*}
     */
    const establishUpdateFeeForm = useCallback(async () => {

        // if the coin or type is not set, then abort
        if( typeof coin.current === 'undefined' || typeof type.current === 'undefined') {
            setFees('');
            return;
        }

        const coinRequest = coin.current.toLowerCase();
        const typeRequest = (type.current == 'LOCKING') ? 'feekb' : 'feerequired';

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

    useEffect(() => {

        console.log('editFee or fetch changed');
    }, [editFee]);

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
    };

    const handleTypeClose = () => {
        setAnchorTypeEl(null);
    };

    const saveFormData = async() => {

        if( typeof coin.current === 'undefined' || typeof type.current === 'undefined' || typeof editFee === 'undefined') {
            return;
        }

        const coinRequest = coin.current.toLowerCase();
        const typeRequest = (type.current == 'LOCKING') ? 'feekb' : 'feerequired';

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

    /**
     * Sign For Fees
     *
     * Sign all unsigned fees for the user account's address.
     *
     * @returns {Promise<void>}
     */
    const signForeignFees  = async() => {

        try {
            await qortalRequest({
                action: "SIGN_FOREIGN_FEES"
            });

        } catch (error) {
            console.error(error)
        }
    }

    /**
     * On Signing
     *
     * Called when the user clicks the signing button.
     *
     * @param event the event
     *
     * @returns {Promise<void>}
     */
    const onSigning = async(event) => {
        event.preventDefault();

        signForeignFees();
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
                <form onSubmit={onSigning}>
                    <div>
                        <button type="submit" disabled={!isButtonEnabled}>Sign</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
