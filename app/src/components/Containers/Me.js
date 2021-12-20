import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import {
	meProducersSelector,
	makePermissionSelector
} from '../Selectors';
import { permissions } from '../../permissions';
import { withRoomContext } from '../../RoomContext';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import * as appPropTypes from '../appPropTypes';
import { useIntl, FormattedMessage } from 'react-intl';
import VideoView from '../VideoContainers/VideoView';
import Volume from './Volume';
import Fab from '@material-ui/core/Fab';
import Tooltip from '@material-ui/core/Tooltip';
import MicIcon from '@material-ui/icons/Mic';
import MicOffIcon from '@material-ui/icons/MicOff';
import VideoIcon from '@material-ui/icons/Videocam';
import VideoOffIcon from '@material-ui/icons/VideocamOff';
import ScreenIcon from '@material-ui/icons/ScreenShare';
import SettingsVoiceIcon from '@material-ui/icons/SettingsVoice';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

const styles = (theme) =>
	({
		root :
		{
			flex               : '0 0 auto',
			boxShadow          : 'var(--peer-shadow)',
			border             : 'var(--peer-border)',
			backgroundColor    : 'var(--peer-bg-color)',
			backgroundImage    : 'var(--peer-empty-avatar)',
			backgroundPosition : 'bottom',
			backgroundSize     : 'auto 85%',
			backgroundRepeat   : 'no-repeat',
			'&.hover'          :
			{
				boxShadow : '0px 1px 3px rgba(0, 0, 0, 0.05) inset, 0px 0px 8px rgba(82, 168, 236, 0.9)'
			},
			'&.active-speaker' :
			{
				// transition  : 'filter .2s',
				// filter      : 'grayscale(0)',
				borderColor : 'var(--active-speaker-border-color)'
			},
			'&:not(.active-speaker):not(.screen)' :
			{
				// transition : 'filter 10s',
				// filter     : 'grayscale(0.75)'
			},
			'&.webcam' :
			{
				order : 1
			},
			'&.screen' :
			{
				order : 2
			}
		},
		viewContainer :
		{
			position : 'relative',
			width    : '100%',
			height   : '100%'
		},
		meTag :
		{
			position   : 'absolute',
			float      : 'left',
			top        : '50%',
			left       : '50%',
			transform  : 'translate(-50%, -50%)',
			color      : 'rgba(255, 255, 255, 0.5)',
			zIndex     : 1,
			margin     : 0,
			opacity    : 0,
			transition : 'opacity 0.1s ease-in-out',
			'&.hover'  :
			{
				opacity : 1
			}
		},
		controls :
		{
			position       : 'absolute',
			width          : '100%',
			height         : '100%',
			display        : 'flex',
			justifyContent : 'center',
			alignItems     : 'flex-end',
			padding        : theme.spacing(1),
			zIndex         : 21,
			touchAction    : 'none',
			pointerEvents  : 'none',
			'&.hide'       :
			{
				transition : 'opacity 0.1s ease-in-out',
				opacity    : 0
			},
			'&.hover' :
			{
				opacity : 1
			},
			'& .fab' :
			{
				margin        : theme.spacing(1),
				pointerEvents : 'auto',
				'&.smallest'  : {
					width     : 30,
					height    : 30,
					minHeight : 'auto',
					margin    : theme.spacing(0.5)
				}
			}
		},
		ptt :
		{
			position       : 'absolute',
			width          : '100%',
			height         : '100%',
			display        : 'flex',
			justifyContent : 'center',
			alignItems     : 'center',
			zIndex         : 1200,
			opacity        : 0,
			transition     : 'opacity 1s ease',
			pointerEvents  : 'none',
			padding        : theme.spacing(1),
			'& div'        :
			{
				color           : 'rgba(255, 255, 255, 0.7)',
				backgroundColor : 'rgba(245, 0, 87, 0.70)',
				borderRadius    : '20px',
				textAlign       : 'center',
				opacity         : 1,
				padding         : theme.spacing(1),
				margin          : theme.spacing(1)
			},
			'&.enabled' :
			{
				transition : 'opacity 0.1s',
				opacity    : 1
			}
		}

	});

const Me = (props) =>
{
	const [ hover, setHover ] = useState(false);

	const intl = useIntl();

	let touchTimeout = null;

	const {
		roomClient,
		me,
		settings,
		activeSpeaker,
		spacing,
		style,
		advancedMode,
		micProducer,
		webcamProducer,
		screenProducer,
		extraVideoProducers,
		hasAudioPermission,
		hasVideoPermission,
		hasScreenPermission,
		transports,
		noiseVolume,
		classes
	} = props;

	// const width = style.width;

	const height = style.height;

	const [ buttonSize, setButtonSize ] = useState('large');

	const [ controlsAdditionalStyles, setControlsAdditionalStyles ] = useState(

		{
			flexDirection : 'row'
		}
	);

	const [ meTagAdditionalStyles, setMeTagAdditionalStyles ] = useState(
		{
			fontSize : '1.5vh'
		}
	);

	useEffect(() =>
	{
		if (height > 0 && height <= 190)
		{
			setButtonSize('small');

			setControlsAdditionalStyles({
				flexDirection : 'row',
				alignItems    : 'flex-start'
			});

			setMeTagAdditionalStyles({
				fontSize : '0em'
			});

		}

		else if (height > 190 && height <= 320)
		{

			setButtonSize('small');

			setControlsAdditionalStyles({
				flexDirection : 'column'
			});

			setMeTagAdditionalStyles({
				fontSize : '2.0em'
			});

		}

		else if (height > 320 && height <= 400)
		{
			setButtonSize('medium');

			setControlsAdditionalStyles({
				flexDirection : 'column'
			});

			setMeTagAdditionalStyles({
				fontSize : '2.5em'
			});

		}

		else if (height > 400)
		{
			setButtonSize('large');

			setControlsAdditionalStyles({
				flexDirection : 'column'
			});

			setMeTagAdditionalStyles({
				fontSize : '3.0em'
			});

		}

	}, [ height ]);

	const videoVisible = (
		Boolean(webcamProducer) &&
		!webcamProducer.locallyPaused &&
		!webcamProducer.remotelyPaused
	);

	const screenVisible = (
		Boolean(screenProducer) &&
		!screenProducer.locallyPaused &&
		!screenProducer.remotelyPaused
	);

	let micState;

	let micTip;

	if (!me.canSendMic || !hasAudioPermission)
	{
		micState = 'unsupported';
		micTip = intl.formatMessage({
			id             : 'device.audioUnsupported',
			defaultMessage : 'Audio unsupported'
		});
	}
	else if (!micProducer)
	{
		micState = 'off';
		micTip = intl.formatMessage({
			id             : 'device.activateAudio',
			defaultMessage : 'Activate audio'
		});
	}
	else if (!micProducer.locallyPaused &&
		!micProducer.remotelyPaused &&
		!settings.audioMuted)
	{
		micState = 'on';
		micTip = intl.formatMessage({
			id             : 'device.muteAudio',
			defaultMessage : 'Mute audio'
		});
	}
	else
	{
		micState = 'muted';
		micTip = intl.formatMessage({
			id             : 'device.unMuteAudio',
			defaultMessage : 'Unmute audio'
		});
	}

	let webcamState;

	let webcamTip;

	if (!me.canSendWebcam || !hasVideoPermission)
	{
		webcamState = 'unsupported';
		webcamTip = intl.formatMessage({
			id             : 'device.videoUnsupported',
			defaultMessage : 'Video unsupported'
		});
	}
	else if (webcamProducer && !settings.videoMuted)
	{
		webcamState = 'on';
		webcamTip = intl.formatMessage({
			id             : 'device.stopVideo',
			defaultMessage : 'Stop video'
		});
	}
	else
	{
		webcamState = 'off';
		webcamTip = intl.formatMessage({
			id             : 'device.startVideo',
			defaultMessage : 'Start video'
		});
	}

	let screenState;

	let screenTip;

	if (!me.canShareScreen || !hasScreenPermission)
	{
		screenState = 'unsupported';
		screenTip = intl.formatMessage({
			id             : 'device.screenSharingUnsupported',
			defaultMessage : 'Screen sharing not supported'
		});
	}
	else if (screenProducer)
	{
		screenState = 'on';
		screenTip = intl.formatMessage({
			id             : 'device.stopScreenSharing',
			defaultMessage : 'Stop screen sharing'
		});
	}
	else
	{
		screenState = 'off';
		screenTip = intl.formatMessage({
			id             : 'device.startScreenSharing',
			defaultMessage : 'Start screen sharing'
		});
	}
	const [
		screenShareTooltipOpen,
		screenShareTooltipSetOpen
	] = React.useState(false);

	const screenShareTooltipHandleClose = () =>
	{
		screenShareTooltipSetOpen(false);
	};

	const screenShareTooltipHandleOpen = () =>
	{
		screenShareTooltipSetOpen(true);
	};

	if (screenState === 'off' && me.screenShareInProgress && screenShareTooltipOpen)
	{
		screenShareTooltipHandleClose();
	}

	const spacingStyle =
	{
		'margin' : spacing
	};

	if (me.picture)
	{
		spacingStyle.backgroundImage = `url(${me.picture})`;
		spacingStyle.backgroundSize = 'auto 100%';
	}

	let audioScore = null;

	if (micProducer && micProducer.score)
	{
		audioScore =
			micProducer.score.reduce(
				(prev, curr) =>
					(prev.score < curr.score ? prev : curr)
			);
	}

	let videoScore = null;

	if (webcamProducer && webcamProducer.score)
	{
		videoScore =
			webcamProducer.score.reduce(
				(prev, curr) =>
					(prev.score < curr.score ? prev : curr)
			);
	}

	useEffect(() =>
	{
		let poll;

		const interval = 1000;

		if (advancedMode)
		{
			poll = setInterval(() => roomClient.getTransportStats(), interval);
		}

		return () => clearInterval(poll);
	}, [ roomClient, advancedMode ]);

	// menu
	const [ menuAnchorElement, setMenuAnchorElement ] = React.useState(null);
	const [ showAudioAnalyzer, setShowAudioAnalyzer ] = React.useState(null);

	const handleMenuOpen = (event) =>
	{
		setMenuAnchorElement(event.currentTarget);
	};

	const handleMenuClose = () =>
	{
		setMenuAnchorElement(null);
	};

	return (
		<React.Fragment>
			<div
				className={
					classnames(
						classes.root,
						'webcam',
						hover ? 'hover' : null,
						activeSpeaker ? 'active-speaker' : null
					)
				}
				onMouseOver={() => setHover(true)}
				onMouseOut={() => setHover(false)}
				onTouchStart={() =>
				{
					if (touchTimeout)
						clearTimeout(touchTimeout);

					setHover(true);
				}}
				onTouchEnd={() =>
				{
					if (touchTimeout)
						clearTimeout(touchTimeout);

					touchTimeout = setTimeout(() =>
					{
						setHover(false);
					}, 2000);
				}}
				style={spacingStyle}
			>

				<div className={classes.viewContainer} style={style}>
					{/* PTT */}
					{ me.browser.platform !== 'mobile' && height >= 170 &&
						<div className={classnames(
							classes.ptt,
							(micState === 'muted' && me.isSpeaking) ? 'enabled' : null
						)}
						>
							<div>
								<FormattedMessage
									id='me.mutedPTT'
									defaultMessage='You are muted, {br} hold down SPACE-BAR to talk'
									values={{
										br : <br />
									}}
								/>
							</div>
						</div>
					}
					{/* /PTT */}

					{/* ME TAG */}
					<p
						style={{ ...meTagAdditionalStyles }}
						className={
							classnames(
								classes.meTag,
								hover ? 'hover' : null
							)}
					>
						<FormattedMessage
							id='room.me'
							defaultMessage='ME'
						/>
					</p>
					{/* /ME TAG */}

					{/* CONTROLS BUTTONS (inside) */}
					{ !settings.buttonControlBar &&
						<div
							style={{ ...controlsAdditionalStyles }}
							className={classnames(
								classes.controls,
								settings.hiddenControls ? 'hide' : null,
								hover ? 'hover' : null
							)}
							onMouseOver={() => setHover(true)}
							onMouseOut={() => setHover(false)}
							onTouchStart={() =>
							{
								if (touchTimeout)
									clearTimeout(touchTimeout);

								setHover(true);
							}}
							onTouchEnd={() =>
							{
								if (touchTimeout)
									clearTimeout(touchTimeout);

								touchTimeout = setTimeout(() =>
								{
									setHover(false);
								}, 2000);
							}}
						>
							<React.Fragment>
								{/* MICROPHONE */}
								<Tooltip
									title={micTip}
									placement={height <= 190 ? 'bottom' : 'left'}
								>
									<div>
										<Fab
											aria-label={intl.formatMessage({
												id             : 'device.muteAudio',
												defaultMessage : 'Mute audio'
											})}
											className={classnames(
												'fab',
												height <= 170 ? 'smallest': null
											)}
											disabled={
												!me.canSendMic ||
													!hasAudioPermission ||
													me.audioInProgress
											}
											color={micState === 'on' ?
												settings.voiceActivatedUnmute ?
													me.isAutoMuted ? 'secondary' : 'primary'
													: 'default'
												: 'secondary'
											}

											size={buttonSize}
											onClick={() =>
											{
												if (micState === 'off')
													roomClient.updateMic({ start: true });
												else if (micState === 'on')
													roomClient.muteMic();
												else
													roomClient.unmuteMic();
											}}
										>
											{ settings.voiceActivatedUnmute ?
												micState === 'on' ?
													<React.Fragment>
														<svg className='MuiSvgIcon-root' focusable='false' aria-hidden='true'style={{ 'position': 'absolute' }}>
															<defs>
																<clipPath id='cut-off-indicator'>
																	<rect x='0' y='0' width='24' height={24-2.4*noiseVolume}/>
																</clipPath>
															</defs>
														</svg>
														<SettingsVoiceIcon style={{ 'position': 'absolute' }}
															color={'default'}
														/>
														<SettingsVoiceIcon
															clipPath='url(#cut-off-indicator)'
															style={{
																'position' : 'absolute',
																'opacity'  : '0.6'
															}}
															color={me.isAutoMuted ?
																'primary' : 'default'}
														/>
													</React.Fragment>
													: <MicOffIcon />
												: micState === 'on' ?
													<MicIcon />
													:
													<MicOffIcon />
											}
										</Fab>
									</div>
								</Tooltip>
								{/* /MICROPHONE */}

								{/* WEBCAM */}
								<Tooltip
									title={webcamTip}
									placement={height <= 190 ? 'bottom' : 'left'}
								>
									<div>
										<Fab
											aria-label={intl.formatMessage({
												id             : 'device.startVideo',
												defaultMessage : 'Start video'
											})}
											className={classnames(
												'fab',
												height <= 170 ? 'smallest': null
											)}
											disabled={
												!me.canSendWebcam ||
													!hasVideoPermission ||
													me.webcamInProgress
											}
											color={webcamState === 'on' ? 'default' : 'secondary'}
											size={buttonSize}

											onClick={() =>
											{
												webcamState === 'on' ?
													roomClient.disableWebcam() :
													roomClient.updateWebcam({ start: true });
											}}
										>
											{ webcamState === 'on' ?
												<VideoIcon />
												:
												<VideoOffIcon />
											}
										</Fab>
									</div>
								</Tooltip>
								{/* /WEBCAM */}

								{/* SCREENSHARING */}
								{ me.browser.platform !== 'mobile' &&
									<Tooltip open={screenShareTooltipOpen}
										onClose={screenShareTooltipHandleClose}
										onOpen={screenShareTooltipHandleOpen}
										title={screenTip}
										placement={height <= 190 ? 'bottom' : 'left'}
									>
										<div>
											<Fab
												aria-label={intl.formatMessage({
													id             : 'device.startScreenSharing',
													defaultMessage : 'Start screen sharing'
												})}
												className={classnames(
													'fab',
													height <= 170 ? 'smallest': null
												)}
												disabled={
													!hasScreenPermission ||
														!me.canShareScreen ||
														me.screenShareInProgress
												}
												color={screenState === 'on' ? 'primary' : 'default'}
												size={buttonSize}

												onClick={() =>
												{
													if (screenState === 'off')
														roomClient.updateScreenSharing({ start: true });
													else if (screenState === 'on')
														roomClient.disableScreenSharing();
												}}
											>
												<ScreenIcon/>
											</Fab>
										</div>
									</Tooltip>
								}
								{/* /SCREENSHARING */}

								{/* MORE BUTTON */}
								{advancedMode &&
								<React.Fragment>
									<Tooltip
										title={intl.formatMessage({
											id             : 'device.options',
											defaultMessage : 'Options'
										})}
										placement={height <= 190 ? 'bottom' : 'left'}
									>
										<Fab
											aria-label={intl.formatMessage({
												id             : 'device.options',
												defaultMessage : 'Options'
											})}
											className={classnames(
												'fab',
												height <= 170 ? 'smallest': null
											)}
											size={buttonSize}

											onClick={handleMenuOpen}
										>
											<MoreHorizIcon />
										</Fab>
									</Tooltip>

									<Menu
										anchorEl={menuAnchorElement}
										keepMounted
										open={Boolean(menuAnchorElement)}
										onClose={handleMenuClose}
									>
										<MenuItem
											onClick={() =>
											{
												setShowAudioAnalyzer(!showAudioAnalyzer);
												handleMenuClose();
											}}
										>
											{ showAudioAnalyzer ? 'Disable' : 'Enable' } audio analyzer
										</MenuItem>
									</Menu>

								</React.Fragment>
								}
								{/* /MORE BUTTON */}

							</React.Fragment>
						</div>
					}
					{/* /CONTROLS BUTTONS (inside) */}

					<VideoView
						isMe
						isMirrored={settings.mirrorOwnVideo}
						VideoView
						advancedMode={advancedMode}
						peer={me}
						displayName={settings.displayName}
						showPeerInfo
						videoTrack={webcamProducer && webcamProducer.track}
						videoVisible={videoVisible}
						audioTrack={micProducer && micProducer.track}
						audioCodec={micProducer && micProducer.codec}
						videoCodec={webcamProducer && webcamProducer.codec}
						netInfo={transports && transports}
						audioScore={audioScore}
						videoScore={videoScore}
						showQuality
						onChangeDisplayName={(displayName) =>
						{
							roomClient.changeDisplayName(displayName);
						}}
						showAudioAnalyzer={showAudioAnalyzer}
					>
						{ micState === 'muted' ? null : <Volume id={me.id} /> }
					</VideoView>
				</div>
			</div>
			{ extraVideoProducers.map((producer) =>
			{
				return (
					<div key={producer.id}
						className={
							classnames(
								classes.root,
								'webcam',
								hover ? 'hover' : null,
								activeSpeaker ? 'active-speaker' : null
							)
						}
						onMouseOver={() => setHover(true)}
						onMouseOut={() => setHover(false)}
						onTouchStart={() =>
						{
							if (touchTimeout)
								clearTimeout(touchTimeout);

							setHover(true);
						}}
						onTouchEnd={() =>
						{
							if (touchTimeout)
								clearTimeout(touchTimeout);

							touchTimeout = setTimeout(() =>
							{
								setHover(false);
							}, 2000);
						}}
						style={spacingStyle}
					>
						<div className={classes.viewContainer} style={style}>
							<p
								style={{ ...meTagAdditionalStyles }}
								className={
									classnames(
										classes.meTag,
										hover ? 'hover' : null,
										height <= 170 ? 'smallest': null
									)}
							>
								<FormattedMessage
									id='room.me'
									defaultMessage='ME'
								/>
							</p>
							<div
								className={classnames(
									classes.controls,
									settings.hiddenControls ? 'hide' : null,
									hover ? 'hover' : null
								)}
								onMouseOver={() => setHover(true)}
								onMouseOut={() => setHover(false)}
								onTouchStart={() =>
								{
									if (touchTimeout)
										clearTimeout(touchTimeout);

									setHover(true);
								}}
								onTouchEnd={() =>
								{
									if (touchTimeout)
										clearTimeout(touchTimeout);

									touchTimeout = setTimeout(() =>
									{
										setHover(false);
									}, 2000);
								}}
							>
								<Tooltip
									title={webcamTip}
									placement={height <= 190 ? 'bottom' : 'left'}
								>
									<div>
										<Fab
											aria-label={intl.formatMessage({
												id             : 'device.stopVideo',
												defaultMessage : 'Stop video'
											})}
											className={classnames(
												'fab',
												height <= 170 ? 'smallest': null
											)}
											disabled={!me.canSendWebcam || me.webcamInProgress}
											size={buttonSize}
											onClick={() =>
											{
												roomClient.disableExtraVideo(producer.id);
											}}
										>
											<VideoIcon />
										</Fab>
									</div>
								</Tooltip>
							</div>

							<VideoView
								isMe
								isMirrored={settings.mirrorOwnVideo}
								isExtraVideo
								advancedMode={advancedMode}
								peer={me}
								displayName={settings.displayName}
								showPeerInfo
								videoTrack={producer && producer.track}
								videoVisible={videoVisible}
								videoCodec={producer && producer.codec}
								onChangeDisplayName={(displayName) =>
								{
									roomClient.changeDisplayName(displayName);
								}}
							/>
						</div>
					</div>
				);
			})}
			{ screenProducer &&
				<div
					className={classnames(classes.root, 'screen', hover ? 'hover' : null)}
					onMouseOver={() => setHover(true)}
					onMouseOut={() => setHover(false)}
					onTouchStart={() =>
					{
						if (touchTimeout)
							clearTimeout(touchTimeout);

						setHover(true);
					}}
					onTouchEnd={() =>
					{
						if (touchTimeout)
							clearTimeout(touchTimeout);

						touchTimeout = setTimeout(() =>
						{
							setHover(false);
						}, 2000);
					}}
					style={spacingStyle}
				>
					<div className={classes.viewContainer} style={style}>
						<p

							style={{ ...meTagAdditionalStyles }}
							className={
								classnames(
									classes.meTag,
									hover ? 'hover' : null
								)}
						>
							<FormattedMessage
								id='room.me'
								defaultMessage='ME'
							/>
						</p>

						<VideoView
							isMe
							isScreen
							advancedMode={advancedMode}
							videoContain
							videoTrack={screenProducer && screenProducer.track}
							videoVisible={screenVisible}
							videoCodec={screenProducer && screenProducer.codec}
						/>
					</div>
				</div>
			}
		</React.Fragment>
	);
};

Me.propTypes =
{
	roomClient          : PropTypes.any.isRequired,
	advancedMode        : PropTypes.bool,
	me                  : appPropTypes.Me.isRequired,
	settings            : PropTypes.object,
	activeSpeaker       : PropTypes.bool,
	micProducer         : appPropTypes.Producer,
	webcamProducer      : appPropTypes.Producer,
	screenProducer      : appPropTypes.Producer,
	extraVideoProducers : PropTypes.arrayOf(appPropTypes.Producer),
	spacing             : PropTypes.number,
	style               : PropTypes.object,
	hasAudioPermission  : PropTypes.bool.isRequired,
	hasVideoPermission  : PropTypes.bool.isRequired,
	hasScreenPermission : PropTypes.bool.isRequired,
	noiseVolume         : PropTypes.number,
	classes             : PropTypes.object.isRequired,
	theme               : PropTypes.object.isRequired,
	transports          : PropTypes.object.isRequired
};

const makeMapStateToProps = () =>
{
	const canShareAudio =
		makePermissionSelector(permissions.SHARE_AUDIO);
	const canShareVideo =
		makePermissionSelector(permissions.SHARE_VIDEO);
	const canShareScreen =
		makePermissionSelector(permissions.SHARE_SCREEN);

	const mapStateToProps = (state) =>
	{
		let noise;

		// noise = volume under threshold
		if (state.peerVolumes[state.me.id] < state.settings.noiseThreshold)
		{
			// noise mapped to range 0 ... 10 
			noise = Math.round((100 + state.peerVolumes[state.me.id]) /
				(100 + state.settings.noiseThreshold)*10);
		}
		// noiseVolume over threshold: no noise but voice
		else { noise = 10; }

		return {
			me                  : state.me,
			...meProducersSelector(state),
			settings            : state.settings,
			activeSpeaker       : state.me.id === state.room.activeSpeakerId,
			hasAudioPermission  : canShareAudio(state),
			hasVideoPermission  : canShareVideo(state),
			hasScreenPermission : canShareScreen(state),
			noiseVolume         : noise,
			transports          : state.transports
		};
	};

	return mapStateToProps;
};

export default withRoomContext(connect(
	makeMapStateToProps,
	null,
	null,
	{
		areStatesEqual : (next, prev) =>
		{
			return (
				Math.round(prev.peerVolumes[prev.me.id]) ===
				Math.round(next.peerVolumes[next.me.id]) &&
				prev.room === next.room &&
				prev.me === next.me &&
				prev.peers === next.peers &&
				prev.producers === next.producers &&
				prev.settings === next.settings &&
				prev.transports === next.transports
			);
		}
	}
)(withStyles(styles, { withTheme: true })(Me)));
