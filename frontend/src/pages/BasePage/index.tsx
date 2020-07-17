import { createStyles, withStyles, WithStyles } from "@material-ui/styles";
import { Theme } from "pretty-format/build/types";
import React from "react";
import { SecondHeader } from "layout/SecondHeader";
import { Box, Container } from "@material-ui/core";
import { APP_BAR_HEIGHT, LEFT_SECTION_OPEN_WIDTH, SECOND_HEADER_HEIGHT } from "layout/Constants";

const styles = (_theme: Theme) =>
  createStyles({
    root: {},
  });

export interface BasePageProps extends React.Props<any>, WithStyles<typeof styles> {
  noScrollContainer?: boolean;
  leftDrawer?: React.ReactNode;
  secondHeaderLeft?: React.ReactNode;
  secondHeaderRight?: React.ReactNode;
  fullContainer?: boolean;
}

export class BasePageRaw extends React.PureComponent<BasePageProps> {
  public render() {
    const { children, leftDrawer, secondHeaderLeft, secondHeaderRight, fullContainer } = this.props;

    const hasSecondHeader = !!secondHeaderLeft || !!secondHeaderRight;
    return (
      <Box display="flex" flexDirection="column" flex="1">
        {hasSecondHeader && <SecondHeader left={secondHeaderLeft} right={secondHeaderRight} />}

        <Box flex="1" display="flex">
          {!!leftDrawer && (
            <Box width={LEFT_SECTION_OPEN_WIDTH} borderRight="1px solid rgba(0, 0, 0, 0.12)">
              <Box top={hasSecondHeader ? APP_BAR_HEIGHT + SECOND_HEADER_HEIGHT : APP_BAR_HEIGHT} position="sticky">
                {leftDrawer}
              </Box>
            </Box>
          )}

          <Box flex="1">
            <Container maxWidth={fullContainer ? false : "lg"} disableGutters style={{ margin: 0 }}>
              {children}
            </Container>
          </Box>
        </Box>
      </Box>
    );
  }
}

export const BasePage = withStyles(styles)(BasePageRaw);
