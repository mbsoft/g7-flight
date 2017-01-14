# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

Vagrant.require_version ">= 1.5.0"
Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  config.vm.define "local-platform" do |machine|
    # All Vagrant configuration is done here. The most common configuration
    # options are documented and commented below. For a complete reference,
    # please see the online documentation at vagrantup.com.
    # config.ssh.private_key_path = "~/.ssh/id_rsa"
    # config.ssh.forward_agent = true
    # Every Vagrant virtual environment requires a box to build off of.
    # machine.vm.box = "centos/7"
    machine.vm.box = "ubuntu/trusty64"
    machine.vm.hostname = "local-platform"

    # Create a forwarded port mapping which allows access to a specific port
    # within the machine from a port on the host machine. In the example below,
    # accessing "localhost:8080" will access port 80 on the guest machine.
    machine.vm.network "forwarded_port", guest: 80, host: 38080
    machine.vm.network "forwarded_port", guest: 8000, host: 38000
    machine.vm.network "forwarded_port", guest: 5555, host: 38555
    machine.vm.network "forwarded_port", guest: 22, host: 2222, id: "ssh"

    machine.vm.synced_folder ".", "/vagrant", disabled: true
    machine.vm.synced_folder ".", "/home/vagrant/g7-flight", create: true

    machine.vm.provision "ansible" do |ansible|
      ansible.playbook = "./ansible/deploy-local-platform.yml"
      ansible.verbose = "v"
      ansible.inventory_path = "./ansible/hosts/platform"
    end

    machine.vm.provider "virtualbox" do |vb|
      vb.memory = 4096
      vb.customize [ "guestproperty", "set", :id, "/VirtualBox/GuestAdd/VBoxService/--timesync-set-threshold", 10000 ]
    end
  end
end
