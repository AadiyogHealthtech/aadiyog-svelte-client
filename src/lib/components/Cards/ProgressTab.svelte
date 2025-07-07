<script>
	import { onMount } from 'svelte';
	import RightArrow from '$lib/icons/RightArrowIcon.svelte';
	import Back from '$lib/icons/BackIcon.svelte';
	
	// Dynamic data structure
	let progressData = {
		workoutTime: { 
			weeklyHours: 0, 
			avgHours: 0, 
			days: [0, 0, 0, 0, 0, 0, 0],
			hasWorkout: [false, false, false, false, false, false, false]
		}
	};
	let isLoading = true;
	let error = null;

	// Days of the week
const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
	const currentDayIndex = new Date().getDay();
	const currentDate = new Date();

	// Function to format time - shows hours, minutes, or seconds based on value
	function formatTime(hours) {
		const totalSeconds = hours * 3600;
		
		// If less than 1 second (edge case)
		if (totalSeconds < 1) {
			return `${(totalSeconds * 1000)}ms`;
		}
		
		// If less than 1 minute
		if (totalSeconds < 60) {
			return `${(totalSeconds)}s`;
		}
		
		// If less than 1 hour
		if (hours < 1) {
			const minutes = (totalSeconds / 60);
			return `${minutes}m`;
		}
		
		// For 1 hour or more
		return `${hours.toFixed(1)}h`;
	}

	// Function to get start of current week (Sunday)
	function getStartOfWeek(date) {
		const d = new Date(date);
		const day = d.getDay();
		const diff = d.getDate() - day;
		return new Date(d.setDate(diff));
	}

	// Authentication utilities
	async function getAuthData() {
		try {
			// console.log('Getting auth data from localStorage...');
			const authToken = localStorage.getItem('authToken');
			const userId = localStorage.getItem('userId');
			const userEmail = JSON.parse(localStorage.getItem('user'))?.email;

			// console.log('Auth data from storage:', { authToken, userId, userEmail });

			if (!authToken) {
				throw new Error('Please login to view workout data');
			}

			if (userId) {
				// console.log('Using existing userId:', userId);
				return { token: authToken, userId };
			}

			if (userEmail) {
				// console.log('Fetching userId by email:', userEmail);
				const userIdFromEmail = await getUserIdByEmail(authToken, userEmail);
				if (userIdFromEmail) {
					// console.log('Found userId by email:', userIdFromEmail);
					localStorage.setItem('userId', userIdFromEmail);
					return { token: authToken, userId: userIdFromEmail };
				}
			}

			throw new Error('Unable to determine user ID');
		} catch (error) {
			console.error('Error in getAuthData:', error);
			throw error;
		}
	}

	async function getUserIdByEmail(token, email) {
		try {
			const response = await fetch(
				`https://v2.app.aadiyog.in/api/aadiyog-users?filters[email][$eq]=${encodeURIComponent(email)}`,
				{
					headers: {
						'Authorization': `Bearer ${token}`
					}
				}
			);

			if (!response.ok) {
				throw new Error('Failed to fetch user by email');
			}

			const data = await response.json();
			return data.data[0]?.id || null;
		} catch (error) {
			console.error('Error fetching user by email:', error);
			return null;
		}
	}

	// Function to process workout sessions into chart data
	async function fetchWorkoutData() {
		try {
			// console.log('Fetching workout data...');
			const authData = await getAuthData();
			// console.log('Auth data:', authData);
			
			const startOfWeek = getStartOfWeek(currentDate);
			const endOfWeek = new Date(startOfWeek);
			endOfWeek.setDate(endOfWeek.getDate() + 6);
			endOfWeek.setHours(23, 59, 59, 999);
			
			const startISO = startOfWeek.toISOString();
			const endISO = endOfWeek.toISOString();
			
			// console.log('Date range for API call:', { startISO, endISO });
			
			const response = await fetch(
				`https://v2.app.aadiyog.in/api/aadiyog-users/${authData.userId}?` + 
				`populate[posts][filters][date][$gte]=${startISO}&` +
				`populate[posts][filters][date][$lte]=${endISO}&` +
				`populate[posts][fields][0]=time&` +
				`populate[posts][fields][1]=date`,
				{
					headers: {
						'Authorization': `Bearer ${authData.token}`
					}
				}
			);
			
			if (!response.ok) {
				const errorData = await response.json();
				console.error('API Error:', errorData);
				throw new Error(errorData.message || 'Failed to fetch data');
			}
			
			const data = await response.json();
			// console.log('Raw API response:', data);
			
			if (data.data?.attributes?.posts?.data) {
				// console.log('Found workout sessions:', data.data.attributes.posts.data);
				processWorkoutData(data.data.attributes.posts.data);
			} else {
				// console.log('No workout sessions found for this week');
				progressData = {
					workoutTime: {
						weeklyHours: 0,
						avgHours: 0,
						days: [0, 0, 0, 0, 0, 0, 0],
						hasWorkout: [false, false, false, false, false, false, false]
					}
				};
			}
		} catch (err) {
			console.error('Error in fetchWorkoutData:', err);
			error = err.message;
		} finally {
			isLoading = false;
		}
	}

	function processWorkoutData(sessions) {
		// console.log('Processing workout sessions:', sessions);
		
		const weekDays = Array(7).fill(0);
		const hasWorkout = Array(7).fill(false);
		const startOfWeek = getStartOfWeek(currentDate);
		// console.log('Start of current week:', startOfWeek.toISOString());

		// If no sessions, return empty data
		if (!sessions || sessions.length === 0) {
			// console.log('No workout sessions found');
			progressData = {
				workoutTime: {
					weeklyHours: 0,
					avgHours: 0,
					days: [0, 0, 0, 0, 0, 0, 0],
					hasWorkout: [false, false, false, false, false, false, false]
				}
			};
			return;
		}

		sessions.forEach((session, index) => {
			// console.log(`\nProcessing session ${index + 1}/${sessions.length}:`, session);
			
			try {
				// Try to find the date in various possible locations
				const possibleDate = 
					session.attributes?.date || 
					session.attributes?.Date || 
					session.date || 
					session.Date ||
					session.attributes?.createdAt ||
					session.createdAt;

				if (!possibleDate) {
					console.warn('No date found in session, using current date as fallback');
					const fallbackDate = new Date();
					processSession(fallbackDate, session);
					return;
				}

				// Parse the date
				const sessionDate = new Date(possibleDate);
				if (isNaN(sessionDate.getTime())) {
					console.warn('Invalid date format, using current date as fallback:', possibleDate);
					const fallbackDate = new Date();
					processSession(fallbackDate, session);
					return;
				}

				// Process valid date
				processSession(sessionDate, session);

			} catch (error) {
				console.error(`Error processing session ${index}:`, error);
			}
		});

		function processSession(date, session) {
			const dayOfWeek = date.getDay();
			const timeInMs = session.attributes?.time || session.time || 0;
			const durationHours = timeInMs / (1000 * 60 * 60);
			
			// console.log('Session details:', {
			// 	date: date.toISOString(),
			// 	dayOfWeek,
			// 	dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek],
			// 	durationHours: durationHours.toFixed(2) + 'h',
			// 	timeInMs
			// });

			// Check if session is within current week
			if (date < startOfWeek || date > new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000)) {
				// console.log('Session is not from current week, skipping');
				return;
			}

			weekDays[dayOfWeek] += durationHours;
			hasWorkout[dayOfWeek] = true;
		}

		// Calculate statistics
		const daysWithWorkouts = weekDays.filter((_, index) => hasWorkout[index]);
		const weeklyTotal = weekDays.reduce((sum, hours) => sum + hours, 0);
		const avgHours = daysWithWorkouts.length > 0 ? weeklyTotal / daysWithWorkouts.length : 0;

		// console.log('\nWeekly summary:', {
		// 	dailyHours: weekDays.map(h => h.toFixed(2)),
		// 	daysWithWorkouts: hasWorkout,
		// 	weeklyTotal: weeklyTotal.toFixed(2) + 'h',
		// 	averageHours: avgHours.toFixed(2) + 'h'
		// });

		// Update progressData
		progressData = {
			workoutTime: {
				weeklyHours: parseFloat(weeklyTotal.toFixed(2)),
				avgHours: parseFloat(avgHours.toFixed(2)),
				days: weekDays.map(hours => parseFloat(hours.toFixed(4))),
				hasWorkout: hasWorkout
			}
		};

		// console.log('Final progressData:', JSON.stringify(progressData, null, 2));
	}

	// Function to calculate bar height for workout time
	function getWorkoutBarHeight(value) {
		const maxValue = Math.max(...progressData.workoutTime.days, 1);
		return (value / maxValue) * 120;
	}

	// Function to check if day should be gray (no workout)
	function isNoWorkoutDay(dayIndex) {
		return !progressData.workoutTime.hasWorkout[dayIndex];
	}

	// Function to check if day is in the future
	function isFutureDay(dayIndex) {
		const today = new Date();
		const dayOfWeek = today.getDay();
		const currentDayInWeek = (dayIndex - dayOfWeek + 7) % 7;
		return currentDayInWeek > dayOfWeek;
	}

	// Fetch data when component mounts
	onMount(async () => {
		// console.log('Component mounted, fetching data...');
		try {
			await fetchWorkoutData();
		} catch (err) {
			console.error('Error in onMount:', err);
			error = err.message;
			isLoading = false;
		}
	});
</script>

<div class="progress-container">
	<!-- Header with navigation -->
	<div class="flex flex-row items-center mt-6 sm:mt-8 mb-6">
		<Back color="#F37003" />
		<h2 class="text-neutral-grey-3 font-semibold mx-2 sm:mx-4 text-sm sm:text-base">This Week</h2>
		<RightArrow />
	</div>

	{#if isLoading}
		<div class="loading-container">Loading workout data...</div>
	{:else if error}
		<div class="error-container">
			{error}
			{#if error.includes('login') || error.includes('authenticated')}
				<a href="/login" class="text-orange-500 underline mt-2 block">Go to Login</a>
			{:else}
				<button on:click={() => fetchWorkoutData()} class="text-orange-500 underline mt-2 block">
					Try Again
				</button>
			{/if}
		</div>
	{:else}
		<!-- Workout Time Section -->
		<div class="section-container">
			<h2 class="section-title">Workout Time</h2>
			
			<!-- Stats Row -->
			<div class="stats-row">
				<div class="stat-item">
					<h3 class="stat-value">{formatTime(progressData.workoutTime.weeklyHours)}</h3>
					<p class="stat-label">Weekly Total</p>
				</div>
				<div class="stat-item">
					<h3 class="stat-value">{formatTime(progressData.workoutTime.avgHours)}</h3>
					<p class="stat-label">Daily Average</p>
				</div>
			</div>

			<!-- Workout Time Chart -->
			<div class="chart-container">
				<!-- Y-axis labels -->
				<div class="y-axis">
					<span class="y-label">2.5h</span>
					<span class="y-label">2h</span>
					<span class="y-label">1.5h</span>
					<span class="y-label">1h</span>
					<span class="y-label">0.5h</span>
				</div>
				
				<!-- Bars -->
				<div class="bars-container">
					{#each progressData.workoutTime.days as value, index}
						<div class="bar-wrapper">
							<div class="bar-bg {isNoWorkoutDay(index) || isFutureDay(index) ? 'inactive-day' : ''}">
								<div 
									class="bar {isNoWorkoutDay(index) || isFutureDay(index) ? 'inactive-day' : 'active-day'}" 
									style="height: {getWorkoutBarHeight(value)}px"
								></div>
							</div>
							<span class="day-label">{daysOfWeek[index]}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.progress-container {
		padding: 0 16px;
		max-width: 100%;
	}

	.section-container {
		margin-bottom: 40px;
	}

	.section-title {
		font-family: 'Lato', sans-serif;
		font-weight: 600;
		font-size: 18px;
		line-height: 22px;
		color: #333;
		margin-bottom: 16px;
	}

	.stats-row {
		display: flex;
		gap: 32px;
		margin-bottom: 24px;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
	}

	.stat-value {
		font-weight: 700;
		font-size: 24px;
		line-height: 28px;
		color: #333;
		margin-bottom: 4px;
	}

	.stat-label {
		font-weight: 400;
		font-size: 14px;
		line-height: 16px;
		color: #666;
	}

	.chart-container {
		position: relative;
		display: flex;
		align-items: flex-end;
		height: 160px;
		margin-top: 20px;
	}

	.y-axis {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		height: 120px;
		margin-right: 12px;
		margin-bottom: 20px;
	}

	.y-label {
		font-size: 12px;
		color: #999;
		line-height: 1;
	}

	.bars-container {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		flex: 1;
		height: 140px;
		gap: 8px;
	}

	.bar-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		flex: 1;
	}

	.bar-bg {
		width: 24px;
		height: 120px;
		background-color: #FFE8D6;
		border-radius: 12px;
		display: flex;
		align-items: flex-end;
		overflow: hidden;
		margin-bottom: 8px;
	}

	.bar-bg.inactive-day {
		background-color: #E5E5E5;
	}

	.bar {
		width: 100%;
		border-radius: 12px;
		transition: height 0.3s ease;
	}

	.bar.active-day {
		background-color: #F37003;
	}

	.bar.inactive-day {
		background-color: #B8B8B8;
	}

	.day-label {
		font-size: 12px;
		color: #666;
		font-weight: 500;
	}

	.loading-container {
		padding: 20px;
		text-align: center;
		font-size: 16px;
		color: #666;
	}
	
	.error-container {
		padding: 20px;
		text-align: center;
		font-size: 16px;
		color: #ff3333;
		background: #fff0f0;
		border-radius: 8px;
		margin: 20px 0;
	}

	button {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		font: inherit;
	}

	/* Responsive adjustments */
	@media (min-width: 640px) {
		.progress-container {
			padding: 0 24px;
		}

		.section-title {
			font-size: 20px;
		}

		.stat-value {
			font-size: 28px;
		}

		.bar-bg {
			width: 32px;
		}

		.bars-container {
			gap: 12px;
		}
	}

	@media (min-width: 768px) {
		.progress-container {
			padding: 0 32px;
		}

		.stats-row {
			gap: 48px;
		}
	}
</style>