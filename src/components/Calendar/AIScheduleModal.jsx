import React, { useState } from 'react';
import { Modal, Form, Input, Button, Select, DatePicker, TimePicker, message } from 'antd';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase/config';
import moment from 'moment';

const { Option } = Select;
const { TextArea } = Input;

const AIScheduleModal = ({ visible, onCancel, onSuccess, initialDate, userId }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      
      const startDateTime = moment(values.date)
        .set('hour', values.time.hour())
        .set('minute', values.time.minute())
        .toDate();
      
      const endDateTime = moment(startDateTime).add(2, 'hours').toDate();

      await addDoc(collection(db, 'essaySchedules'), {
        title: values.title,
        topic: values.topic,
        focusArea: values.focusArea,
        start: startDateTime,
        end: endDateTime,
        status: 'scheduled',
        userId,
        notes: values.notes,
        createdAt: new Date()
      });

      message.success('Essay scheduled successfully!');
      onSuccess();
    } catch (error) {
      console.error("Error scheduling essay: ", error);
      message.error('Failed to schedule essay');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Schedule New Essay Practice"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={700}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          date: initialDate ? moment(initialDate) : moment(),
          time: moment().set('hour', 14).set('minute', 0),
          focusArea: 'Grammar'
        }}
      >
        <Form.Item
          name="title"
          label="Session Title"
          rules={[{ required: true, message: 'Please input a title!' }]}
        >
          <Input placeholder="e.g., Argumentative Essay Practice" />
        </Form.Item>

        <Form.Item
          name="topic"
          label="Essay Topic"
          rules={[{ required: true, message: 'Please input a topic!' }]}
        >
          <TextArea rows={3} placeholder="Describe the essay topic or leave blank for AI suggestion" />
        </Form.Item>

        <Form.Item
          name="focusArea"
          label="Focus Area"
          rules={[{ required: true }]}
        >
          <Select>
            <Option value="Grammar">Grammar</Option>
            <Option value="Structure">Structure</Option>
            <Option value="Vocabulary">Vocabulary</Option>
            <Option value="Coherence">Coherence</Option>
            <Option value="Argumentation">Argumentation</Option>
          </Select>
        </Form.Item>

        <div style={{ display: 'flex', gap: '16px' }}>
          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true }]}
            style={{ flex: 1 }}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="time"
            label="Time"
            rules={[{ required: true }]}
            style={{ flex: 1 }}
          >
            <TimePicker format="HH:mm" minuteStep={15} style={{ width: '100%' }} />
          </Form.Item>
        </div>

        <Form.Item
          name="notes"
          label="Additional Notes"
        >
          <TextArea rows={2} placeholder="Any specific requirements or notes" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Schedule Essay
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AIScheduleModal;