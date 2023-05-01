//Node Module Requirements --------------------------------------------------------------------------------------------------



//Password Encryptor and Decryptor
const bcrypt = require('bcrypt');
//Encryption Level Determination
const saltRounds = 15;
//File Manager
const fs = require('fs')
//Terminal Block Text Creator
const figlet = require('figlet')
//String Math Calculator
const stringmath = require('string-math');
//API Integration
const fetch = require('node-fetch')
//API Path
let path = 'http://localhost:3000'



//Terminal Interface Creation ---------------------------------------------------------------------------------------------


//Interface
//Creates the interface that will be used when questions and answers are inputted and outputted through the terminal
const readline = require('readline').createInterface({
    //Terminal Input
    input: process.stdin,
    //Terminal Output
    output: process.stdout
});



//Initiating Code ------------------------------------------------------------------------------------------------



//Startup Line
//Initiates the Account Login / Creation Sequence
startup()

var loggedIn = false

//Terminal Session Cache Settings
//Cache characters allowed to be used during Session ID creation
var chars = "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ";
//Cache characters length which determines how long the Session ID will be
var sessionLength = 25;
//Global Cached Session ID used to identify whether or not one particular terminal is permitted to be used
var sessionID = "";

//Session ID
//Outputs each character individually, adding characters until it reaches the Session Length (sessionLength)
for (var i = 0; i <= sessionLength; i++) {
    //Random Number Generator
    var randomNumber = Math.floor(Math.random() * chars.length);
    //Character Selector
    sessionID += chars.substring(randomNumber, randomNumber +1);
}



//One Time Password Handler ---------------------------------------------------------------------------



//Admin OTP Handler
//Runs when a user attempts to log in to Administrative Mode with their OTP
var adminMode = false
//Main function
async function adminOTP(){
    //Confirms the user doesn't already have Administrative Mode enabled
    if(adminMode === false){
        //Simple spacing line
        console.log('-+-----------------------------------------------+')
        //Requests the user to enter their One Time Password
        readline.question('Please enter your OTP: ', response => {
            let stringify = {
                sessionID: sessionID,
                otp: response
            }
            async function postData(url = '') {
                const response = await fetch(url, {
                method: 'POST', // *GET, POST, PUT, DELETE, etc.
                mode: 'cors', // no-cors, *cors, same-origin
                cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
                credentials: 'same-origin', // include, *same-origin, omit
                body: JSON.stringify(stringify),
                headers: { 'Content-Type': 'application/json' },
                redirect: 'follow', // manual, *follow, error
                referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
                });
                return response.json()
            }
            postData(`${path}/otpcheck`).then((data) => {
                if(data.status === 2014){
                    //Informs the user that they are now running in Administrative Mode
                    console.log('OTP Success! You are now running in administrative mode')
                    //Sets the users Administrative Mode to true
                    adminMode = true
                    //Simple spacing line
                    console.log('-+-----------------------------------------------+')
                    //Reopenes the terminal to commands
                    openResponses()
                }
                if(data.status === 2015){
                    //Informs the user that the OTP they have used is not currently valid
                    console.log('INVALID OTP')
                    //Simple spacing line
                    console.log('-+-----------------------------------------------+')
                    //Reopenes the terminal to commands
                    openResponses()
                }
                if(data.status === 2016){
                    //Informs the user that the OTP they have used is not currently a valid administrative account
                    console.log('INVALID ADMINISTRATIVE ACCOUNT')
                    //Simple spacing line
                    console.log('-+-----------------------------------------------+')
                    //Reopenes the terminal to commands
                    openResponses()
                }
            });
        })
    }
    //Runs if Administrative Mode is already enabled
    if(adminMode === true){
        //Informs the user they already have Administrative Mode enabled
        console.log('You are already running in Administrative Mode')
        //Reopenes the terminal to commands
        openResponses()
    }
}



//Main Account Handling ----------------------------------------------------------------------------------------------------



//Startup Code
//Asks the user to either login to an already existing account or create one of their own
async function startup(){
    //Simple Spacing Line
    console.log('-+-----------------------------------------------+')
    //Requests whether user would like to login to or create an account
    readline.question('Would you like to Login or Create your account?\n', answer => {
        //Validates input, allowing for various options, and ignoring invalid requests
        if(answer === 'Login' || answer === 'login' || answer === 'Create' || answer === 'create'){
            //Allows the login sequence, if the user enters 'Login' or 'login'
            if(answer === 'Login' || answer === 'login'){
                //Runs the login() function to initiate the login sequence
                login()
            }
            //Allows the account creation sequence, if the user enters 'Create' or 'create'
            if(answer === 'Create' || answer === 'create'){
                //Runs the create() function to initiate the account creation sequence
                createUser()
            }
        } else {
            //Informs the user of their invalid option, and to try again
            console.log('Invalid option, please try again.')
            //Restarts the startup sequence
            startup()
        }
    })
}

//Create User Sequence Step I
//Asks the user to enter a username, and if the username is already selected, has the user try again
async function createUser(){
    //Simple Spacing Line
    console.log('-+-----------------------------------------------+')
    //Asks the user to create a username, which must be original
    readline.question('Please enter a username: ', username => {
        //Checks to see if the username already has been claimed in the username and passwords cache
        if(fs.existsSync(`./passwords/${username}.json`)){
            //Informs the user if their username has already been claimed, and asks the user to try again
            console.log('Error: Username already is taken, please try another username.')
            //Restarts the Create User Sequence
            createUser()
        } else {
            //Moves the user on to the password creation portion of account creation, if their username is valid
            createPass(username)
        }
    })
}

//Create User Sequence Step II
//Asks the user to enter a password, and then encrypts the password to the accounts file
async function createPass(username){
    //Asks the user to create a password
    readline.question('Please enter a password: ', password => {
        //Encrypts the password, using the predetermined encryption level
        bcrypt.hash(password, saltRounds, function(err, hash) {
            //Writes the users encrypted password to their accounts file
            fs.writeFileSync(`./passwords/${username}.json`, `{ "password": "${hash}" }`)
            //Informs the user of their accounts creation being complete
            console.log('Account creation complete.')
            //Moves the user on to the login sequence, to verify they are able to login to their newly created account
            login()
        });
    })
}
  
//Login Sequence Step I
//Gets the users username, and then forwards that username to Login Sequence Step II
async function login(){
    //Simple Spacing Line
    console.log('-+-----------------------------------------------+')
    //Asks the user to input their username
    readline.question('Please enter your username: ', username => {
        //Forwards username to Step II
        getPassword(username)
    });
}

//Login Sequence Step II
//Takes the inputted users username, requests a password, verifies the users information, and then moves on to next steps
async function getPassword(username){
    //Asks the user to input their password
    readline.question('Please enter your password: ', password => {
        let stringify = {
            username: username,
            password: password,
            sessionID: sessionID
        }
        async function postData(url = '') {
            const response = await fetch(url, {
            method: 'POST', // *GET, POST, PUT, DELETE, etc.
            mode: 'cors', // no-cors, *cors, same-origin
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            credentials: 'same-origin', // include, *same-origin, omit
            body: JSON.stringify(stringify),
            headers: { 'Content-Type': 'application/json' },
            redirect: 'follow', // manual, *follow, error
            referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
            });
            return response.json()
        }
        postData(`${path}/login`).then((data) => {
            if(data.status===200){
                //Notifies user of the successful login attempt
                console.log('Successfully logged in.')
                //Provides the user a help command so if they are new to the software they can still use it
                console.log(`You can run the command 'help' to see a full list of our supported commands`)
                //Simple Spacing Line
                console.log('-+-----------------------------------------------+')
                //Opens up the terminal for commands
                openResponses()
                loggedIn = true
            }
            if(data.status === 400 || data.status === 401){
                //Informs the user of their failed login attempt
                console.log('Incorrect username or password.')
                //Restarts the login process from Step I
                login()
            }
        });
    });
}

//Password Changer
//Allows a user who is already logged in to verify their old information, and update their password to something newer
async function changePassword(username){
    //Requests the users old password to verify a password change is allowed
    readline.question('Please enter your old password: ', password => {
        //Checks to make sure the user account file still exists
        if(fs.existsSync(`./passwords/${username}.json`)){
            //Reads the raw text from the users account file
            let rawData = fs.readFileSync(`./passwords/${username}.json`)
            //Parses the raw text from the users account file into a JavaScript object that can be used
            let jsonData = JSON.parse(rawData)
            //Compares the old password entered with the encrypted password on the account file
            bcrypt.compare(password, jsonData.password, function(err, result) {
                //If the old password enters matches the encrypted password on file
                if(result === true){
                    //Requests the new password the user would like to use
                    readline.question('Please enter your new password: ', newPassword => {
                        //Confirms that the new password does not match the old password
                        if(newPassword!==password){
                            //Informs the user that the password change is complete
                            console.log('Password change is complete.')
                            //Simple Spacing Line
                            console.log('-+-----------------------------------------------+')
                            //Encrypts the new password
                            bcrypt.hash(password, saltRounds, function(err, hash) {
                                //Writes the new encrypted password to the account file
                                fs.writeFileSync(`./passwords/${username}.json`, `{ "password": "${hash}" }`)
                                //Reopens the terminal for commands
                                openResponses()
                            });
                            //Writes the updated password, along with the already used username, to the Session ID Cache to ensure terminal remains valid
                            fs.writeFileSync(`./sessions/${sessionID}.json`, `{ "user": "${username}", "password": "${newPassword}" }`)
                        } else {
                            //If the new password matches the old password, it informs the user that this isn't allowed
                            console.log('Your new password can not be the same as your old password')
                            //Simple Spacing Line
                            console.log('-+-----------------------------------------------+')
                            //Restarts the password change process
                            changePassword(username)
                        }
                    })
                }
                //If the old password does not match the encrypted password on file
                if(result === false){
                    //Informs the user that the password change attempt has failed due to an incorrect username or password
                    console.log('Incorrect username or password')
                    //Simple Spacing Line
                    console.log('-+-----------------------------------------------+')
                    //Reopens the terminal to commands
                    openResponses()
                }
            })
        } else {
            //Informs the user that the password change attempt has failed due to an incorrect username or password
            console.log('Incorrect username or password')
            //Simple Spacing Line
            console.log('-+-----------------------------------------------+')
            //Reopens the terminal to commands
            openResponses()
        }
    });
}

//Password Checker Settings
//Sets the frequency of the terminal verification to every 10,000 ms, or 10 seconds, to verify the terminal and account is still valid
setInterval(passwordRecheck, 5*1000)

//Password Checker
//Verifies that the terminal session and account information is still valid during the terminals use
async function passwordRecheck(){
    if(loggedIn === true){
        let stringify = {
            sessionID: sessionID
        }
        async function postData(url = '') {
            const response = await fetch(url, {
            method: 'POST', // *GET, POST, PUT, DELETE, etc.
            mode: 'cors', // no-cors, *cors, same-origin
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            credentials: 'same-origin', // include, *same-origin, omit
            body: JSON.stringify(stringify),
            headers: { 'Content-Type': 'application/json' },
            redirect: 'follow', // manual, *follow, error
            referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
            });
            return response.json()
        }
        postData(`${path}/passwordcheck`).then((data) => {
            if(data.status === 2011){
                //Closes the terminal interface, disabling user inputs
                readline.close()
                //Informs the user that their account password no longer is matching the one that they used to login, and that they must restart the terminal
                console.log('\nACCESS REMOVED! Your account no longer exists.')
                //Deletes the Session ID Cache
                fs.unlinkSync(`./sessions/${sessionID}.json`)
                //Shuts down the process and terminal entirely
                process.exit()
            }
            if(data.status === 2012){
                //Closes the terminal interface, disabling user inputs
                readline.close()
                //Informs the user that their account password no longer is matching the one that they used to login, and that they must restart the terminal
                console.log('\nACCESS REMOVED! Your account password no longer matches what you used to login.\nYou must restart the software and log in again.')
                //Deletes the Session ID Cache
                fs.unlinkSync(`./sessions/${sessionID}.json`)
                //Shuts down the process and terminal entirely
                process.exit()
            }
            if(data.status === 2013){
                //Closes the terminal interface, disabling user inputs
                readline.close()
                //Informs the user that their account password no longer is matching the one that they used to login, and that they must restart the terminal
                console.log('\nINVALID SESSION! Your terminal session no longer exists.\nPlease restart the terminal.')
                //Shuts down the process and terminal entirely
                process.exit()
            }
        });
    }
}



//Terminal Interface Command Handler -------------------------------------------------------------------------------------------



//Terminal Command Handler
//This opens the terminal to commands, allowing the user to input text and do various actions
async function openResponses(){
    //Argument Handler
    //Controls what arguments are valid, based on stored files which are updated live
    //Reads raw data for the stored arguments 0 file
    let rawAllowedArgs0 = fs.readFileSync(`./args/allowedArgs0.json`)
    //Parses raw data for the stored arguments 0 file into an object
    let allowedArgs0 = JSON.parse(rawAllowedArgs0).args
    //Reads raw data for the stored arguments 1 file
    let rawAllowedArgs1 = fs.readFileSync(`./args/allowedArgs1.json`)
    //Parses raw data for the stored arguments 1 file into an object
    let allowedArgs1 = JSON.parse(rawAllowedArgs1).args
    //Reads raw data for the stored administrative arguments 0 file
    let rawAllowedArgs0Admin = fs.readFileSync(`./args/allowedArgs0.admin.json`)
    //Parses raw data for the stored administrative arguments 0 file into an object
    let allowedArgs0Admin = JSON.parse(rawAllowedArgs0Admin).args
    //Leaves the question blank, so the user can input text to run commands
    readline.question('> ', response => {
        //Splits up the text by spaces, so that the handler can use different pieces for different commands
        const args = response.split(' ')
        //Confirms the first argument entered is valid with the First Argument Filter (allowedArgs[0])
        if(allowedArgs0.includes(args[0]) || allowedArgs0Admin.includes(args[0])){
            //A simple help command
            if(args[0]==='help'){
                //Reads the raw text from the help file, which has instructions for each command and their subcommands
                let text = fs.readFileSync('./help', 'utf8')
                //Reads the raw text from the admin help file, which has instructions for each command and their subcommands
                let text2 = fs.readFileSync('./adminhelp', 'utf8')
                //Takes that text and adds spacing before and after to make it easier to read, returning it to the console
                console.log('\n'+text+'\n')
                //Checks if Administrative Mode is enabled
                if(adminMode === true){
                    //Logs Administrative Mode commands
                    console.log('\n'+text2+'\n')
                }
                //Reopens the terminal to commands
                openResponses()
            }
            //The main execute command, which is where most actions are within subcommands
            if(args[0]==='execute'){
                //Confirms that the user has actually entered a subcommand, and hasn't left it blank
                if(args[1]){
                    //Confirms if the user has entered a subcommand, it is a valid subcommand (allowedArgs[1])
                    if(allowedArgs1.includes(args[1])){
                        //A simple command where the terminal returns whatever the user has entered past arguments 1 and 2
                        if(args[1]==='conlog'){
                            //Confirms that the user has actually entered something for the terminal to reply with
                            if(args[2]){
                                //Cuts off the beginning of the users input, returning only the text the user has entered for it to reply
                                console.log(response.slice(args[0].length+1+args[1].length+1))
                                //Reopens the terminal to commands
                                openResponses()
                            } else {
                                //Informs the user that they must enter text after the command for the console to reply with
                                console.log(`You must enter text after a ${args[0]} ${args[1]} command.`)
                                //Reopens the terminal to commands
                                openResponses()
                            }
                        }
                        //A simple command where the terminal returns whatever the user has entered, but in block letters
                        if(args[1]==='figlet'){
                            if(args[2]){
                                //Cuts off the beginning of the users input, and then using that text to turn it into block letters, returning it in the terminal
                                figlet(response.slice(args[0].length+1+args[1].length+1), function(err, data) {
                                    console.log(data)
                                    //Reopens the terminal to commands
                                    openResponses()
                                })
                            } else {
                                //Informs the user that they must enter text after the command for the console to reply with in block letters
                                console.log(`You must enter text after a ${args[0]} ${args[1]} command.`)
                                //Reopens the terminal to commands
                                openResponses()
                            }
                        }
                        //A command that takes text input from the terminal and returns the math calculated from it
                        if(args[1]==='stringmath'){
                            //Confirms math has been entered
                            if(args[2]){
                                //Stringmath function using the string-math NPM
                                stringMath(args[2], (error, answer) => {
                                    //Checks to see if an error occured
                                    if (error) {
                                        //Informs the user of the error occured
                                        console.log(args[2]+': An error occured when trying to do this math, or text was detected in the calculations');
                                        //Reopens the terminal to commands
                                        openResponses();
                                    }
                                    //Checks to see if an answer was received
                                    if (answer) {
                                        //Informs the user of the answer to their equasion
                                        console.log(args[2]+` = `+answer);
                                        //Reopens the terminal to commands
                                        openResponses();
                                    }
                                });
                            } else {
                                //Informs the user that they must enter at least 1 piece of math after the stringmath command
                                console.log(`You must enter at least one math argument after a ${args[0]} ${args[1]} command.`)
                                //Reopens the terminal to commands
                                openResponses()
                            }
                        }
                    } else {
                        //Informs the user that their subcommand is invalid
                        console.log(`${args[1]} is not a valid ${args[0]} command.`)
                        //Reopens the terminal to commands
                        openResponses()
                    }
                } else {
                    //Informs a user that their subcommand must contain text after it
                    console.log(`You must enter text after a ${args[0]} command.`)
                    //Reopens the terminal to commands
                    openResponses()
                }
            }
            //A command which provides details about the modules used to make this system function
            if(args[0]==='details'){
                //Reads the raw text from the detail file, which has instructions for each command and their subcommands
                let text = fs.readFileSync('./details', 'utf8')
                //Takes that text and adds spacing before and after to make it easier to read, returning it to the console
                console.log('\n'+text+'\n')
                //Reopens the terminal to commands
                openResponses()
            }
            //Initiates Administrative Mode Activation Sequence
            if(args[0]==='admin'){
                //Forwards to Administrative One-Time-Password System
                adminOTP()
            }
            //Executes Administrative commands
            if(allowedArgs0Admin.includes(args[0])){
                //Executes if Administrative mode is enabled
                if(adminMode === true){
                    //Shows a list of all valid terminal sessions
                    if(args[0]==='sessionlist'){
                        //Catalogs all sessions in the sessions folder
                        let dir = fs.readdirSync(`./sessions/`)
                        //Logs the sessions in array format to the console
                        console.log(dir)
                        //Reopens the terminal to commands
                        openResponses()
                    }
                    //Shows the current Session ID to prevent deactivation of your own session
                    if(args[0]==='currentsession'){
                        console.log(`Your current Session ID is ${sessionID}`)
                        //Reopens the terminal to commands
                        openResponses()
                    }
                    //Deactives Sessions based on ID
                    if(args[0]==='sessionkill'){
                        //Confirms the user has entered a session
                        if(args[1]){
                            //Confirms the Session exists
                            if(fs.existsSync(`./sessions/${args[1]}`)){
                                //Deactivates the session
                                fs.unlinkSync(`./sessions/${args[1]}`)
                            } else {
                                //Informs the user the Session ID they are using is not valid
                                console.log('You must enter a valid Session ID to kill it')
                            }
                        } else {
                            //Informs the user they need to enter a Session ID to delete an account
                            console.log('You must enter a Session ID to kill it')
                        }
                        //Reopens the terminal to commands
                        openResponses()
                    }
                    //Provides the user with a list of all valid users
                    if(args[0]==='userlist'){
                        //Catalogs all users in the passwords folder
                        let dir = fs.readdirSync(`./passwords/`)
                        //Logs the users in array format to the console
                        console.log(dir)
                        //Reopens the terminal to commands
                        openResponses()
                    }
                    //Deletes users accounts based on username
                    if(args[0]==='userdelete'){
                        //Confirms the user has entered a user
                        if(args[1]){
                            //Confirms the account exists
                            if(fs.existsSync(`./passwords/${args[1]}`)){
                                //Deletes the users stored account
                                fs.unlinkSync(`./passwords/${args[1]}`)
                            } else {
                                //Informs the user the Session ID they are using is not valid
                                console.log('You must enter a valid username to delete it')
                            }
                        } else {
                            //Informs the user they need to enter a username to delete an account
                            console.log('You must enter a username to delete it')
                        }
                        //Reopens the terminal to commands
                        openResponses()
                    }
                }
                //Executes if Administrative mode is disabled
                if(adminMode === false){
                    //Informs the user the command doesn't exist (for users)
                    console.log(`${args[0]} is not a valid command.`)
                    //Reopens the terminal to commands
                    openResponses()
                }
            }
            //Initiates the password change process if the user enters the passreset command
            if(args[0]==='passreset'){
                //Simple Spacing Line
                console.log('-+-----------------------------------------------+')
                //Asks the user to enter their username for the password change process
                readline.question('Please enter your username: ', username => {
                    //Forwards the users username to the Password Changer
                    changePassword(username)
                });
            }
            //Logs the user out of the terminal and Session ID Cache
            if(args[0]==='logout'){
                //Sends a simple goodbye message to indicate the user has logged out
                console.log('Goodbye!')
                let stringify = {
                    sessionID: sessionID
                }
                async function postData(url = '') {
                    const response = await fetch(url, {
                    method: 'POST', // *GET, POST, PUT, DELETE, etc.
                    mode: 'cors', // no-cors, *cors, same-origin
                    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
                    credentials: 'same-origin', // include, *same-origin, omit
                    body: JSON.stringify(stringify),
                    headers: { 'Content-Type': 'application/json' },
                    redirect: 'follow', // manual, *follow, error
                    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
                    });
                    return response.json()
                }
                postData(`${path}/logout`)
                //Restarts the startup process, requesting the user to login or create an account
                startup()
                loggedIn = false
            }
            //Shuts down the terminal entirely, removing the Session ID Cache and stopping the terminal
            if(args[0]==='shutdown'){
                console.log('Goodbye!')
                //Simple Spacing Line
                console.log('-+-----------------------------------------------+')
                let stringify = {
                    sessionID: sessionID
                }
                async function postData(url = '') {
                    const response = await fetch(url, {
                    method: 'POST', // *GET, POST, PUT, DELETE, etc.
                    mode: 'cors', // no-cors, *cors, same-origin
                    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
                    credentials: 'same-origin', // include, *same-origin, omit
                    body: JSON.stringify(stringify),
                    headers: { 'Content-Type': 'application/json' },
                    redirect: 'follow', // manual, *follow, error
                    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
                    });
                    return response.json()
                }
                postData(`${path}/shutdown`)
                //Shuts down the process and terminal entirely
                setTimeout(shutdownExecuteFinal, 0.5*1000)
                async function shutdownExecuteFinal(){
                    process.exit()
                }
            }
        } else {
            //Informs a user that their command is invalid
            console.log(`${args[0]} is not a valid command.`)
            //Reopens the terminal to commands
            openResponses()
        }
    })
}



//End ------------------------------------------------------------------------------------------------------------------