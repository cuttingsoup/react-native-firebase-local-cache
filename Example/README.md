# Firebase Local Cache Example

## Getting Started

### Setup a Firebase Project

Mine won't be around forever, so build up a free Firebase project and get the details by ading a "Web" app on you project overview page.

You'll also need to add some values to the realtime database, you can do so by copying this to a file and importing it:

```json
{
  "items" : {
    "-KgCr7WHT7qJwHWdPucd" : {
      "description" : "This is a short description of the thing. I will make it the same for each! Except for this number: 1",
      "name" : "item 1"
    },
    "-KgCrKOhfACgRUQ0Jqlx" : {
      "description" : "This is a short description of the thing. I will make it the same for each! Except for this number: 2",
      "name" : "item 2"
    },
    "-KgEiREmxHOVSZM7WB17" : {
      "description" : "This is a short description of the thing. I will make it the same for each! Except for this number: 3",
      "name" : "item 3"
    },
    "-KgGX2x6fHShZVOam48M" : {
      "description" : "This is a short description of the thing. I will make it the same for each! Except for this number: 4",
      "name" : "item 4"
    }
  },
  "user-items" : {
    "user1" : {
      "-KgCr7WHT7qJwHWdPucd" : {
        "name" : "item 1"
      },
      "-KgEiREmxHOVSZM7WB17" : {
        "name" : "item 3"
      },
      "-KgGX2x6fHShZVOam48M" : {
        "name" : "item 4"
      }
    }
  }
}
```

This is, as usual, a contrived example where each user has a list of items stored in `user-items` that contains some limited information, while the majority of the info is stored in an object under `items`. For permissions, just set everything to read only:

```json
{
  "rules": {
    ".read": true,
    ".write": "auth != null"
  }
}
```

Run as you would any other react-native program:

`react-native run-android`
or
`react-native run-ios`

Hopefully that works...

Note that recently there has been a dependency issue with the react-navigation package and as a temporary fix the package is being pulled from the latest in the GitHub repo. This will need to change.

## Notes

The first time you load any screen, nothing has been cached, so both lists will take the same amount of time to load. To see the difference, open up a few items repeatedly, as well as completely quit the app and restart it to see the difference in the load time of the item list.