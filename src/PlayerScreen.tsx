// PlayerScreen
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Video,
    ResizeMode,
    AVPlaybackStatus,
} from 'expo-av';
import { Controls } from './Controls';
import { View, Text, useTVEventHandler, StyleSheet, TVEventControl, ImageBackground } from 'react-native';

// Typings bug fix
type HWEvent = {
    eventType: 'up' | 'down' | 'right' | 'left' | 'longUp' | 'longDown' | 'longRight' | 'longLeft' | 'blur' | 'focus' | 'pan' | string;
    eventKeyAction?: -1 | 1 | 0 | number | undefined;
    tag?: number | undefined;
    body?: {
      state: 'Began' | 'Changed' | 'Ended',
      x: number,
      y: number,
      velocityX: number, // These are incorrectly defined in the react-native/typee/public/ReactNativeTVTypes.d.ts 
      velocityY: number
    } | undefined
  };


type Status = Partial<AVPlaybackStatus> & {
    isPlaying?: boolean;
    isLoaded?: boolean;
    isBuffering?: boolean;
    didJustFinish?: boolean;
    uri?: string;
    rate?: number;
    positionMillis?: number;
    playableDurationMillis?: number;
    durationMillis?: number;
    error?:string;
    // custom
    progressPercentage?: string; // custom strings with '%' as DimensionValue 
    playablePercentage?: string; // set during player status updates
};

const defaultStatus = {
    progressUpdateIntervalMillis: 500,
    playableDurationMillis: 0,
    positionMillis: 0,
    durationMillis: 0,
    shouldPlay: false,
    rate: 1.0,
    shouldCorrectPitch: false,
    volume: 1.0,
    isMuted: false,
    isLooping: false,
    isLoaded: false,
    isBuffering: false,
    isPlaying: false,
    uri: null,
    error: null
}

interface VideoItem {
    uri: string;
    title?: string;
}

interface VideoSource {
    uri: string;
    type?: string;
}

interface PosterSource {
    uri: string;
}


interface PlaylistItem {
    title?:string,
    posterSource?:PosterSource;
    source: VideoSource
}

let _controls_timeout;

export const PlayerScreen = ({ }) => {
    // Fast-Forward/Rewind skip amount
    const _skip_ms = 5000;
    const video = useRef<Video>();

    const indexRef = useRef(0)
    const playlist:PlaylistItem[] = [
        {
            title:'Big Buck Bunny',
            source: {
                uri:'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
                type:'hls'
            }
        },
        {
            title:'Tears Of Steel',
            source: {
                uri:'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8',
                type:'hls'
            }
        },
        {
            title:'DJ Turntable',
            source: {
                uri:'https://test-streams.mux.dev/pts_shift/master.m3u8',
                type:'hls'
            }
        },
    ]


    // Data about the current video item
    const videoItem_Ref = useRef<VideoItem>();
    // Video status
    const status = useRef<Status>({ isPlaying: false });

    const defaultPosterSource = require('@assets/images/placeholder-SMPTE-Color-Bars-HD.jpg')

    const backgroundImage = require('@assets/images/bg-spotlight.jpg');
    const [videoSource, setVideoSource] = useState<VideoSource>(null)
    const [posterSource, setPosterSource] = useState(defaultPosterSource)


    // These will be set via Controls component onMount.
    let setStatus = null
    let setVideoItemData = null
    let currentFocusName = null

    const onControlsViewMount = (dataFromChild: any[]) => {
        setStatus = dataFromChild[0]
        setVideoItemData = dataFromChild[1]
        currentFocusName = dataFromChild[2]
    };

    const showControlsRef = useRef<boolean>(false);
    const [showControls, setShowControls] = useState<boolean>(false);

    const startControlsTimeout = () => {
        // return // hold up while building the ui..
        _controls_timeout = setTimeout(() => {
            setControls(false)
        }, 8000)
    }

    const resetControlsTimeout = () => {
        _controls_timeout && clearInterval(_controls_timeout)
        startControlsTimeout()
    }

    const setControls = (show: boolean) => {
        _controls_timeout && clearInterval(_controls_timeout)
        showControlsRef.current = show
        // console.log('show controls is now', showControlsRef.current)
        setShowControls(showControlsRef.current)

        if (showControlsRef.current) {
            // console.log('PlayerScreen: showcontrols animation...', showControlsRef.current);
            startControlsTimeout()
        }
    }

    useTVEventHandler((evt:HWEvent) => {
        if (evt && evt.eventType && video && status.current.isLoaded) {
            // console.log('TV Event', evt)
            // console.log('currentFocus', currentFocus.current)
            /*
                Fixed a bug in react-native tvos typings. 
                https://github.com/react-native-tvos/react-native-tvos/blob/efc6306fa372a2368c2fb74faf9001db5e8da302/packages/react-native/types/public/ReactNativeTVTypes.d.ts#L57
                `velocityx` & `velocityy` should be `velocityX` & `velocityY`
                Reported to source repo discussions : https://github.com/react-native-tvos/react-native-tvos/discussions/720
            */

            let _eventType = evt.eventType
            if (_eventType === 'pan') {
                // console.log(evt?.body)
                const _direction = determineGestureDirection(evt?.body?.velocityX, evt?.body?.velocityY)
                // console.log('pan', _direction)
                _eventType = _direction;
            }
            switch (_eventType) {
                // case 'pan':
                //     //  console.log(evt?.body)
                //     break;
                case 'up':
                case 'swipeUp':
                    console.log('UP')
                    if (showControlsRef.current && currentFocusName && currentFocusName.current === 'topBorder') {
                        console.log('HIDE CONTROLS')
                         setControls(false)
                    }
                    break;
                case 'down':
                case 'swipeDown':
                    console.log('DOWN')
                    if (!showControlsRef.current) {
                        console.log('SHOW CONTROLS')
                        setControls(true)
                    }
                    break;
                case 'left':
                case 'swipeLeft':
                    if (showControlsRef.current) {
                        resetControlsTimeout()
                        if (status && currentFocusName && currentFocusName.current === 'progressThumb') {
                            let _pos_ms = status.current.positionMillis - _skip_ms
                            if (_pos_ms < 0) return
                            console.log('LEFT - rewind 5 seconds', status.current.positionMillis, _pos_ms)
                            video.current.setStatusAsync({ positionMillis: _pos_ms }).catch(err => {})
                        }
                    }
                    break;
                case 'right':
                case 'swipeRight':
                    if (showControlsRef.current) {
                        resetControlsTimeout()
                        if (status && currentFocusName && currentFocusName.current === 'progressThumb') {
                            let _pos_ms = status.current.positionMillis + _skip_ms
                            if (_pos_ms > status.current.playableDurationMillis) _pos_ms = status.current.playableDurationMillis
                            if (_pos_ms > status.current.durationMillis) return
                            console.log('RIGHT - forward 15 seconds', status.current.positionMillis, _pos_ms, status.current.durationMillis)
                            video.current.setStatusAsync({ positionMillis: _pos_ms }).catch(err => {})
                        }
                    }
                    break;
                default:
                    break;
            }

            // Spacebar on sim and center select button.
            if (evt?.eventType === 'playPause') {
                togglePlayPause();
            }
        }
    });





    useEffect(() => {
        const setup = async () => {
            // Will run before onLayoutRootView. And on every file save while developing. 
            // console.log('useEffect setup');

            // If this component gets used as a Screen in a Navigation.Stack
            /*
            const unsubscribeBeforeRemove = navigation.addListener('beforeRemove', async (e: any) => {
                if (video.current) {
                    video.current.componentWillUnmount();
                }
                // .. any other cleanup.
            })
            */

            TVEventControl.enableTVPanGesture()

            return () => {
                TVEventControl.disableTVPanGesture()
                // return unsubscribeBeforeRemove
            }
        }
        setup()
    }, [])

    const togglePlayPause = async () => {
        if(!status.current?.isLoaded){

            playVideoItem()
            return
        }


        // console.log('playPause', status.current)
        if (status.current?.isPlaying) {
            video.current.pauseAsync();
        } else {
            video.current.playAsync();
        }
    };

    const resetVideo = async () => {
        await video.current.stopAsync()
        await video.current.setStatusAsync(defaultStatus)
        status.current = defaultStatus;
        setStatus(status.current)
        setVideoSource({ uri: null })
    }

    const playVideoItem = async (atIndex:number = indexRef.current) => {
        if(!playlist?.length || !playlist[atIndex]?.source) return console.log('No playlist item source')
        setVideoItemData(playlist[atIndex])
        // loads the video source
        setPosterSource(playlist[atIndex].posterSource ? playlist[atIndex].posterSource : defaultPosterSource)
        setVideoSource(playlist[atIndex].source)
        await video.current.playAsync();
        setControls(true)
    }

    const playNextItem = async () => {
        if(!playlist?.length) return
        console.log('play next ')
        indexRef.current++
        if(indexRef.current >= playlist.length) indexRef.current = 0
        if(!playlist[indexRef.current]) return
        await resetVideo()
        playVideoItem(indexRef.current)
    }
    const playPreviousItem = async () => {
        if(!playlist?.length) return
        console.log('Play previous')
        indexRef.current++
        if(indexRef.current < 0) indexRef.current = playlist.length - 1
        if(!playlist[indexRef.current]) return
        await resetVideo()
        playVideoItem(indexRef.current)
    }

    const onLayoutRootView = useCallback(async () => {
        // Note: while developing, a file save will not run this again after the app renders. The useEffect will.
        // Expo: Click 'R' to do a full reload.
        console.log('onLayoutRootView')

        // Initial load now... 
        if(playlist?.length && playlist[indexRef.current]){
            // setVideoSource( playlist[indexRef.current].source )
            indexRef.current = 0
            playVideoItem(0)
        }

    }, [])

    const onPlaybackStatusUpdate = async (newStatus:Status) => {
        // console.log('newStatus', newStatus)
        if(newStatus?.error){
            console.log('VIDEO ERROR!', newStatus?.error)
            return
        }
        // if(newStatus?.isBuffering){
        //     console.log('Buffering')
        // }
        if (newStatus?.isLoaded) {
            if (newStatus?.didJustFinish) {
                await video.current.stopAsync().catch(err => {})
                await video.current.setStatusAsync(defaultStatus).catch(err => {})
                status.current = defaultStatus;
                setStatus(status.current)
                setVideoSource({ uri: null })
                // autoplay another video ... 
                
                playNextItem() 
            }

            if (newStatus.durationMillis) {
                newStatus.progressPercentage = (newStatus.positionMillis / newStatus.durationMillis) * 100 + '%'
                newStatus.playablePercentage = (newStatus.playableDurationMillis / newStatus.durationMillis) * 100 + '%'
            }
            // Updates Status in Controls.
            if (setStatus) {
                setStatus(status.current)
            }
            // I'm new here.. don't judge ;p
        }
        status.current = newStatus
    }

    const Buffering = () => {
        return (
            <View style={{ zIndex: 20, display:'flex',gap:30, alignItems:'center', justifyContent:'center', backgroundColor:'yellow', padding:20, paddingLeft:30, paddingRight:30, borderRadius:99, position:'absolute', top:100, marginLeft:'auto', marginRight:'auto'}}>
                <Text style={{ color:'black', fontWeight:'bold', fontSize:30, textTransform:'uppercase' }}>Buffering</Text>
            </View>
        )
    }


    return (
        <View style={styles.screen} onLayout={onLayoutRootView}>
            <ImageBackground source={backgroundImage} resizeMode='cover' style={styles.full} />
            {
                // <Buffering></Buffering>
            }
            <Video style={styles.video}
                ref={video}
                source={videoSource}
                usePoster
                posterSource={defaultPosterSource}
                posterStyle={{
                    resizeMode: 'cover',
                }}
                shouldPlay={true}
                resizeMode={ResizeMode.CONTAIN}
                onError={(err) => { console.log('Video ERROR', err) }}
                useNativeControls={false}
                onPlaybackStatusUpdate={onPlaybackStatusUpdate}

            ></Video>
            <Controls show={showControls} onMount={onControlsViewMount} togglePlayPause={togglePlayPause} playNextItem={playNextItem} playPreviousItem={playPreviousItem}></Controls>
            
        </View>

    )
};


// Determine predominant direction based on X/Y velocities.
const determineGestureDirection = (velocityX: number, velocityY: number): string => {
    const absVelocityX = Math.abs(velocityX);
    const absVelocityY = Math.abs(velocityY);
    if (absVelocityX > absVelocityY) {
        if (velocityX > 0) {
            return 'right';
        } else {
            return 'left';
        }
    } else {
        if (velocityY > 0) {
            return 'down';
        } else {
            return 'up';
        }
    }
}

const styles = StyleSheet.create({
    full: {
        flex: 1,
        width: '100%',
        height: '100%',
        position:'absolute'
    },
    screen: {
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: '#ff9900',
        alignItems: 'center',
        justifyContent: 'center',
    },
    video: {
        position:'absolute',
        width:'100%',
        height:'100%',
        zIndex:0
    },
    text: {
        fontSize: 40,
    }
});
