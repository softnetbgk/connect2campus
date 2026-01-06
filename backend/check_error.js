try {
    require('./src/controllers/examScheduleController');
    console.log('Controller loaded successfully');
} catch (e) {
    console.error('Error loading controller:', e);
}
