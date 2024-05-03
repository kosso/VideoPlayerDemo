# React Native tvOS VideoPlayerDemo 

While learning React and RN, this is a demo video player I managed to cobble togther. 

It has a controls component which contains playback controls and a progress bar with focusable slider which works nicely with an Apple TV remote control. (Both types)

No idea if I'm doing this right yet. But it all seems to work fine! 

- Built using EXPO and https://github.com/react-native-tvos/react-native-tvos

### Testing

Clone this repo and cd into it.. 

- `yarn install`
- `export EXPO_TV=1`
- `export NO_FLIPPER=1`
- `npx expo prebuild --clean`
- `yarn ios`

----------------

![screenshot](screenshot.png)

----------------

@kosso - 3 May, 2024