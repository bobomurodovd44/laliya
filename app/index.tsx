import { View } from "react-native";
import { StyledText } from "../components/StyledText";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <StyledText variant="title">Hello World!</StyledText>
      <StyledText variant="body" style={{ marginTop: 20 }}>
        Edit app/index.tsx to edit this screen.
      </StyledText>
    </View>
  );
}
