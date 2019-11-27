#adonis-backup
by: Hussein Elturkey

##installing

it is recommended to install it using:

```
adonis install adonis-backup
```

to save time and get config file directly.

#

## a pckage to gather and compress public directory contents in one file and may backup it to s3 drive.  

## it is important to know that:

this package is underconstruction, so some features in config file are not working yet like exclude, but found for future usage.

## Registering provider

Make sure to register the provider and make all of the following necessary changes inside the `start/app.js` file!

```js

// ...
// Add the command provider
const aceProviders = [
  // ...
  'adonis-backup/providers/BackupProvider',
]

```

## Config

Please update configuration before use. The configuration file is `config/backup.js`.

## use

```
adonis backup:start
```

for using digitalocean spaces or aws, just add s3 drive in config/drive.js

# location

backup will be store in tmp/backup directory