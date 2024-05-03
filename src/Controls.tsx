// Controls...
import { StyleSheet, View, Text, Animated, useTVEventHandler, TVFocusGuideView, Pressable, DimensionValue } from 'react-native';
import { BlurView } from 'expo-blur';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { AVPlaybackStatus, Video } from 'expo-av';

// see : https://github.com/kristerkari/react-native-svg-transformer
import IconPlay from '@assets/icons/play_no_circle.svg'
import IconPause from '@assets/icons/pause_no_circle.svg'
import IconStop from '@assets/icons/stop_no_circle.svg'
import IconSkipPrev from '@assets/icons/skip_previous.svg'
import IconSkipNext from '@assets/icons/skip_next.svg'

export const Controls = ({ onMount, togglePlayPause, playPreviousItem, playNextItem }) => {


    const [currentStatus, setCurrentStatus] = useState<Status>();
    const [videoItemData, setVideoItemData] = useState<VideoItem>();

    const playPauseRef = useRef();
    const skipPrevRef = useRef();
    const skipNextRef = useRef();
    const progressThumbRef = useRef();
    const topBorderRef = useRef();

    // Name of currently focussed element. (Passing back to PlayerScreen to determine remote control actions from our progress 'slider')
    const currentFocusNameRef = useRef('')
    // Mostly did this for debugging.
    const _setCurrentFocusName = (name: string) => {
        // console.log('_setCurrentFocusName', name)
        currentFocusNameRef.current = name
    }

    useEffect(() => {
        videoItemData && console.log('VIDEO ITEM DATA:', videoItemData)
    },[videoItemData])

    // Define onMount to supply interface back to parent when trigged by onLayout
    useEffect(() => {
        onMount([setCurrentStatus, setVideoItemData, currentFocusNameRef])
    }, [onMount]);

    const ControlButton = useMemo(() => {
        return ({ Icon, _ref, name, hpf = false, size = 120, iconSize = 100, callback = null }) => {
            const [focussed, setFocussed] = useState(false)
            return (
                <Pressable
                    ref={_ref}
                    style={[styles.button, { width: size }, focussed && styles.buttonFocused]}
                    isTVSelectable
                    hasTVPreferredFocus={hpf}
                    tvParallaxProperties={{ magnification: 1.08, pressMagnification: 0.995 }}
                    onPress={() => { callback && callback(); /*console.log('pressed', name);*/ }}
                    onBlur={() => setFocussed(false)}
                    onFocus={() => { setFocussed(true); _setCurrentFocusName(name) }}>
                    <Icon style={{ width: iconSize, height: iconSize }}></Icon>
                </Pressable>
            )
        }
    }, [])
    
    const onLayoutControls = useCallback(async () => {
        // console.log('controls layout ...')
    }, [])

    return (
        <View style={styles.controlsCont} onLayout={onLayoutControls}>
            {/* Backdrop to blur the video in the backgorund */}
            <BlurView intensity={8} tint='systemMaterialDark' style={styles.blurViewBg}></BlurView>

            {/* Progress Bar */}
            {
                <TVFocusGuideView autoFocus destinations={[progressThumbRef.current]} style={[{ backgroundColor: '#555555aa', marginLeft: 'auto', marginRight: 'auto', width: '95%', height: 4, marginTop: 40, marginBottom: 20 }]}>
                    {
                        (currentStatus && currentStatus.progressPercentage && currentStatus.durationMillis) &&
                        <>
                            {/* Playable Duration */}
                            {
                                currentStatus.playablePercentage && <View style={[{ backgroundColor: '#888888aa', display: 'flex', alignItems: 'center', position: 'absolute', zIndex: 0, top: 0, bottom: 0, left: 0, width: currentStatus.playablePercentage as DimensionValue }]}></View>
                            }

                            {/* Progress Playback */}
                            {
                                currentStatus.progressPercentage &&
                                <View style={[{ backgroundColor: 'yellow', display: 'flex', alignItems: 'center', position: 'absolute', zIndex: 1, top: 0, bottom: 0, left: 0, width: currentStatus.progressPercentage as DimensionValue }]}>
                                    {/* Progress Thumb */}
                                    <Pressable
                                        style={[{ zIndex: 3, width: 10, height: 10, borderRadius: 99, backgroundColor: 'yellow', position: 'absolute', top: '-80%', right: 0 }, currentFocusNameRef === progressThumbRef.current && { backgroundColor: 'yellow' }]}
                                        // hasTVPreferredFocus
                                        isTVSelectable={true}
                                        key={'progressThumb'}
                                        ref={progressThumbRef}
                                        onFocus={() => { /*setCurrentFocus(progressThumbRef.current);*/ _setCurrentFocusName('progressThumb') }}
                                        tvParallaxProperties={{ magnification: 4 }}
                                    ></Pressable>
                                </View>
                            }
                        </>
                    }
                </TVFocusGuideView>
            }

            {/* Control Buttons & Times */}
            <TVFocusGuideView autoFocus style={[{ backgroundColor: 'transparent', display: 'flex', alignItems: 'center', gap: 50, flexDirection: 'row', marginTop: 30 }, styles.focusGuideView]}>
                {/* Current Time */}
                <View style={{ backgroundColor: 'transparent', flex: 0.4 }}>
                    <Text style={[styles.timeText, { textAlign: 'right' }]}>
                        {`${currentStatus?.positionMillis > -1 ? secsToTime(Math.round(currentStatus.positionMillis / 1000)) : '--'}`}
                    </Text>
                </View>
                {/* Playback Control Buttons */}
                <View style={{ flex: 0.3, backgroundColor: 'transparent', display: 'flex', gap: 50, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', marginLeft: 'auto', marginRight: 'auto' }}>
                    <ControlButton callback={playPreviousItem} Icon={IconSkipPrev} size={90} iconSize={60} _ref={skipPrevRef} name="skipPrev"></ControlButton>
                    <ControlButton callback={togglePlayPause} hpf={true} Icon={currentStatus?.isPlaying ? IconPause : IconPlay} _ref={playPauseRef} name="playPause"></ControlButton>
                    <ControlButton callback={playNextItem} Icon={IconSkipNext} size={90} iconSize={60} _ref={skipNextRef} name="skipNext"></ControlButton>
                </View>
                {/* Duration */}
                <View style={{ backgroundColor: 'transparent', flex: 0.4 }}>
                    <Text style={[styles.timeText, { textAlign: 'left' }]}>
                        {`${currentStatus?.durationMillis ? secsToTime(Math.round(currentStatus.durationMillis / 1000)) : '--'}`}
                    </Text>
                </View>
            </TVFocusGuideView>
            {
                videoItemData && <Text style={{ fontWeight:'bold', fontSize:30, color:'white', textAlign:'center', marginTop:24}}>{ videoItemData.title }</Text>
            }



        </View>
    )
}



const styles = StyleSheet.create({
    // for debugging TVFGV
    focusGuideView: {
        // borderColor: 'white',
        // borderWidth: 1
    },
    controlsCont: {
        // backgroundColor: '#111111aa',
        position: 'absolute',
        height: 300,
        width: '100%',
        bottom: 0,
        zIndex: 2
    },
    blurViewBg: {
        backgroundColor: '#00000088', // includes transparency 88
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1
    },
    button: {
        width: 120,
        //height: 120,
        aspectRatio: 1 / 1,
        borderRadius: 99,
        borderWidth: 6,
        borderColor: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonFocused: {
        backgroundColor: 'black',
        borderColor: 'yellow',
    },
    timeText: {
        fontSize: 30,
        color: 'white'
    }
})

const secsToTime = (secs: number) => {

    if (isNaN(secs)) {
        return '-:--';
    }
    // round milliseconds 
    secs = Math.round(secs);

    var h = Math.floor(secs / 3600);
    var m = Math.floor(secs % 3600 / 60);
    var s = Math.floor(secs % 3600 % 60);
    return (h > 0 ? (('' + h).slice(-2) + ':') : '') + ((h < 1 && m < 10 ? '' : '0') + m).slice(-2) + ":" + ('0' + s).slice(-2);

}

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
    error?: string;
    // custom
    progressPercentage?: string; // string with '%' as DimensionValue
    playablePercentage?: string; // 
};

interface VideoItem {
    uri: string;
    title?: string;
}
