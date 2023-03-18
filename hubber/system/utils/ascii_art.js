/**
 * @file ascii_art.js
 * @description ASCII Art Header
 */
module.exports = {
  init: () => {
    console.log(`
   _   _       _     _                  ____               
  | | | |_   _| |__ | |__   ___ _ __   / ___|___  _ __ ___ 
  | |_| | | | | '_ \\| '_ \\ / _ \\ '__| | |   / _ \\| '__/ _ \\
  |  _  | |_| | |_) | |_) |  __/ |    | |__| (_) | | |  __/
  |_| |_|\\__,_|_.__/|_.__/ \\___|_|     \\____\\___/|_|  \\___|
                                                           
  Hubber v${process.env.npm_package_version} - component: ${process.env.npm_package_name}                                                   
  `)
  }
}
