import { Flex, Text, useTheme } from "@aws-amplify/ui-react";

export function Footer() {
  const { tokens } = useTheme();

  return (
    <Flex justifyContent="center" padding={tokens.space.medium}>
      <Text>&copy; 2022 Ancala Health. All Rights Reserved.</Text>
    </Flex>
  );
}