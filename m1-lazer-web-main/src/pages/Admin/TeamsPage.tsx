import React, { useState, useEffect } from 'react';
import { Team, TeamFormValues } from '../../../types/admin';
import { 
  fetchTeams, 
  createTeam, 
  updateTeam, 
  deleteTeam, 
  fetchTeamMembers 
} from '../../../services/adminService';
import { 
  Button, 
  Table, 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  message 
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  LoadingOutlined 
} from '@ant-design/icons';

const TeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<Array<{id: string; username: string}>>([]);
  const [visible, setVisible] = useState<boolean>(false);
  const [formValues, setFormValues] = useState<TeamFormValues>({
    name: '',
    description: '',
    isActive: true
  });
  const [memberSearch, setMemberSearch] = useState<string>('');
  const [availableMembers, setAvailableMembers] = useState<Array<{id: string; username: string}>>([]);

  const [modalType, setModalType] = useState<'create' | 'edit' | 'details' | 'members'>('create');
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState<boolean>(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    setLoading(true);
    try {
      const data = await fetchTeams();
      setTeams(data);
    } catch (err) {
      message.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setModalType('create');
    setFormValues({ name: '', description: '', isActive: true });
    setVisible(true);
  };

  const handleEdit = (team: Team) => {
    setModalType('edit');
    setFormValues({
      name: team.name,
      description: team.description || '',
      isActive: team.isActive
    });
    setSelectedTeam(team);
    setVisible(true);
  };

  const handleDetails = (team: Team) => {
    setModalType('details');
    setSelectedTeam(team);
    setVisible(true);
  };

  const handleMembers = (team: Team) => {
    setModalType('members');
    setSelectedTeam(team);
    loadTeamMembers(team.id);
    setVisible(true);
  };

  const handleDelete = (team: Team) => {
    setTeamToDelete(team);
    setConfirmDeleteVisible(true);
  };

  const loadTeamMembers = async (teamId: string) => {
    try {
      const members = await fetchTeamMembers(teamId);
      setTeamMembers(members);
    } catch (err) {
      message.error('Failed to load team members');
    }
  };

  const handleFormChange = (e: React.ChangeEvent<any>) => {
    const { name, value, type, checked } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalType === 'create') {
        await createTeam(formValues);
        message.success('Team created successfully');
      } else if (modalType === 'edit' && selectedTeam) {
        await updateTeam(selectedTeam.id, formValues);
        message.success('Team updated successfully');
      }
      setVisible(false);
      await loadTeams();
    } catch (err) {
      message.error('Failed to save team');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!teamToDelete) return;
    try {
      await deleteTeam(teamToDelete.id);
      message.success('Team deleted successfully');
      setConfirmDeleteVisible(false);
      await loadTeams();
    } catch (err) {
      message.error('Failed to delete team');
    }
  };

  const renderTeamActions = (team: Team) => (
    <div style={{ display: 'flex', gap: '8px' }}>
      <Button 
        icon={<EyeOutlined />} 
        size="small" 
        onClick={() => handleDetails(team)}
        title="View Details"
      />
      <Button 
        icon={<EditOutlined />} 
        size="small" 
        onClick={() => handleEdit(team)}
        title="Edit Team"
      />
      <Button 
        icon={<DeleteOutlined />} 
        size="small" 
        danger
        onClick={() => handleDelete(team)}
        title="Delete Team"
      />
      <Button 
        icon={<PlusOutlined />} 
        size="small" 
        onClick={() => handleMembers(team)}
        title="Manage Members"
      />
    </div>
  );

  const renderTeamStatus = (isActive: boolean) => (
    <span style={{ 
      padding: '2px 8px', 
      borderRadius: '4px', 
      fontSize: '12px',
      backgroundColor: isActive ? '#e6f7ff' : '#fff2e6',
      color: isActive ? '#1890ff' : '#fa8c16'
    }}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );

  return (
    <div className="admin-teams-page">
      <div className="page-header">
        <h1>Teams Management</h1>
        <Button 
          icon={<PlusOutlined />} 
          onClick={handleCreate}
          type="primary"
        >
          Create New Team
        </Button>
      </div>

      <Table 
        rowKey="id"
        loading={loading}
        columns={[
          {
            title: 'Team Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name)
          },
          {
            title: 'Description',
            dataIndex: 'description',
            key: 'description'
          },
          {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'isActive',
            render: renderTeamStatus
          },
          {
            title: 'Members',
            dataIndex: 'memberCount',
            key: 'memberCount'
          },
          {
            title: 'Created At',
            dataIndex: 'createdAt',
            key: 'createdAt',
            sorter: (a, b) => 
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          },
          {
            title: 'Actions',
            key: 'actions',
            render: renderTeamActions
          }
        ]}
        dataSource={teams}
        pagination={{ pageSize: 20 }}
      />

      {/* Create/Edit Modal */}
      <Modal
        title={modalType === 'create' ? 'Create New Team' : 'Edit Team'}
        visible={visible}
        onOk={handleSubmit}
        onCancel={() => setVisible(false)}
        confirmLoading={modalType === 'create' || modalType === 'edit'}
        width={500}
        footer={[
          <Button key="back" onClick={() => setVisible(false)}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmit}>
            {modalType === 'create' ? 'Create' : 'Update'}
          </Button>
        ]}
      >
        <Form 
          layout="vertical"
          onFinish={handleSubmit}
          name="teamForm"
        >
          <Form.Item
            label="Team Name"
            name="name"
            rules={[{ required: true, message: 'Please input team name!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Description"
            name="description"
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item
            label="Status"
            name="isActive"
            valuePropName="checked"
          >
            <Form.Checkbox>Active</Form.Checkbox>
          </Form.Item>
        </Form>
      </Modal>

      {/* Team Details Modal */}
      <Modal
        title="Team Details"
        visible={visible && modalType === 'details'}
        onCancel={() => setVisible(false)}
        width={600}
        footer={[
          <Button key="back" onClick={() => setVisible(false)}>
            Close
          </Button>
        ]}
      >
        {!selectedTeam ? (
          <p>Loading team details...</p>
        ) : (
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <h2>{selectedTeam.name}</h2>
              <p style={{ color: '#666', marginBottom: '8px' }}>
                {selectedTeam.description || 'No description provided'}
              </p>
              <div>
                <span style={{ 
                  marginRight: '16px', 
                  fontWeight: 'bold'
                }}>
                  Status: {renderTeamStatus(selectedTeam.isActive)}
                </span>
                <span>
                  Created: {new Date(selectedTeam.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
            
            <div>
              <h3>Member Count: {selectedTeam.memberCount || 0}</h3>
              {selectedTeam.memberCount > 0 && (
                <Button 
                  size="small" 
                  onClick={() => {
                    setModalType('members');
                    loadTeamMembers(selectedTeam.id!);
                  }}
                >
                  View Members
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Team Members Modal */}
      <Modal
        title="Team Members"
        visible={visible && modalType === 'members'}
        onCancel={() => setVisible(false)}
        width={800}
        footer={[
          <Button key="back" onClick={() => setVisible(false)}>
            Close
          </Button>
        ]}
      >
        {!selectedTeam ? (
          <p>Loading team data...</p>
        ) : (
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Members ({teamMembers.length})</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Input 
                  placeholder="Search members..."
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                  style={{ width: 200 }}
                />
                <Button 
                  icon={<PlusOutlined />} 
                  onClick={() => {
                    // In a real implementation, this would open a member picker
                    message.info('Member assignment feature would be implemented here');
                  }}
                >
                  Add Members
                </Button>
              </div>
            </div>
            
            <Table 
              rowKey="id"
              columns={[
                {
                  title: 'Username',
                  dataIndex: 'username',
                  key: 'username'
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: (_, record) => (
        <Button 
          icon={<DeleteOutlined />} 
          size="small" 
          danger
          onClick={() => {
            // In a real implementation, this would remove member from team
            message.info('Member removal would be implemented here');
          }}
        >
          Remove
        </Button>
                  )
                }
              ]}
              dataSource={teamMembers.filter(m => 
                memberSearch ? 
                  m.username.toLowerCase().includes(memberSearch.toLowerCase()) : 
                  true
              )}
              pagination={{ pageSize: 10 }}
              emptyText={<div>No members found</div>}
            />
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Confirm Delete Team"
        visible={confirmDeleteVisible}
        onOk={handleDeleteConfirm}
        onCancel={() => setConfirmDeleteVisible(false)}
        width={400}
        footer={[
          <Button key="cancel" onClick={() => setConfirmDeleteVisible(false)}>
            Cancel
          </Button>,
          <Button key="confirm" type="primary" danger onClick={handleDeleteConfirm}>
            Delete
          </Button>
        ]}
      >
        <p>Are you sure you want to delete team "{teamToDelete?.name}"?</p>
        <p style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
          This action cannot be undone and will remove the team from all associated users.
        </p>
      </Modal>
    </div>
  );
};

export default TeamsPage;