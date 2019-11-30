# adonis-backup
by: Hussein Elturkey
## Registering provider:

Make sure to register the provider and make all of the following necessary changes inside the `start/app.js` file!

```js

// ...
// Add the command provider
const aceProviders = [
  // ...
  'adonis-backup/providers/BackupProvider',
]

```

# Config:

Please update configuration before use. The configuration file is `config/backup.js`.

# use:

```
adonis backup:start
```
## cloud only backup:

```
adonis backup:start --cloudOnly
```
## local only backup:

```
adonis backup:start --localOnly
```

## restore backup: (not working yet, will be next update.)

```
adonis backup:start --restore
```

for using digitalocean spaces or aws, just add s3 drive in config/drive.js

## help and flags:
```
adonis backup:start --hlep
```

## Note: 
for using digitalocean spaces or aws, just add s3 drive in config/drive.js.
then add s3 in config/backup.js

```
*/
for example disks: ['local', 's3]
*/
    destination: {
        filename_prefix: 'backup_',
        disks: ['local']
    },
```

# backup location:

backup will be store in tmp/backup directory.