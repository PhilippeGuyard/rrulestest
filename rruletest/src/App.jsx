import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import momentTimezonePlugin from '@fullcalendar/moment-timezone';
import { RRule } from 'rrule';
import { Container, Box, Button, Modal, TextField } from '@mui/material';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import eventsData from './data.json';
import moment from 'moment-timezone';


const generateOccurrences = (event) => {
  const rule = new RRule({
    freq: RRule[event.rrule.freq.toUpperCase()],
    dtstart: moment.utc(event.rrule.dtstart).toDate(),
    until: moment.utc(event.rrule.until).toDate(),
  });

  const dtstartLocal = moment.utc(event.rrule.dtstart);
  const instancesMap = event.instances.reduce((map, instance) => {
    map[instance.originalStart] = instance;
    return map;
  }, {});

  const occurrences = rule.all().map(date => {
    const originalStart = moment.utc(date).format();
    const instance = instancesMap[originalStart] || {};
    const localDate = moment(date).tz('Europe/London');

    // Use instance start time if provided
    if (instance.start) {
      localDate.set({
        hour: moment(instance.start).hour(),
        minute: moment(instance.start).minute(),
      });
    } else {
      localDate.hour(dtstartLocal.hour()).minute(dtstartLocal.minute());
    }

    return {
      id: event.id,
      title: instance.title || event.title,
      description: instance.description || '',
      start: localDate.format('YYYY-MM-DDTHH:mm:ss'),
      originalStart,
      duration: instance.duration || event.duration,
    };
  });

  return occurrences;
};

const App = () => {
  const [events, setEvents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(moment());

  useEffect(() => {
    const parsedEvents = eventsData.flatMap(event => generateOccurrences(event));
    setEvents(parsedEvents);
  }, []);

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSaveEvent = () => {
    if (selectedDate && selectedDate.isValid()) {
      const newEventId = eventsData.length + 1; // Simple unique ID generation
      const newEvent = {
        id: newEventId.toString(),
        title: 'New Event',
        rrule: {
          freq: 'WEEKLY',
          dtstart: selectedDate.utc().toISOString(),
          until: selectedDate.clone().add(10, 'weeks').utc().toISOString(),
        },
        instances: [],
        duration: '01:00',
      };
      const newOccurrences = generateOccurrences(newEvent);
      setEvents([...events, ...newOccurrences]);
      handleCloseModal();
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Container>
        <Box sx={{ height: '90vh', padding: '20px' }}>
          <Button variant="contained" color="primary" onClick={handleOpenModal}>
            Add Event
          </Button>
          <FullCalendar
            plugins={[dayGridPlugin, momentTimezonePlugin]}
            initialView="dayGridMonth"
            events={events}
            timeZone="local"
          />
          <Modal open={modalOpen} onClose={handleCloseModal}>
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 400,
                bgcolor: 'background.paper',
                border: '2px solid #000',
                boxShadow: 24,
                p: 4,
              }}
            >
              <DateTimePicker
                label="Select Date and Time"
                value={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
              <Box mt={2} display="flex" justifyContent="flex-end">
                <Button onClick={handleCloseModal} sx={{ mr: 2 }}>
                  Cancel
                </Button>
                <Button variant="contained" color="primary" onClick={handleSaveEvent}>
                  Save
                </Button>
              </Box>
            </Box>
          </Modal>
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default App;
