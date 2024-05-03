import { StyleSheet, Text, View } from 'react-native';
import { PlayerScreen } from './src/PlayerScreen';
export default function App() {
  return (
    <View style={styles.container}>
      <PlayerScreen></PlayerScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 40,
  }
});
